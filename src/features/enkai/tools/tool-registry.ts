import "server-only";

import { prisma } from "@/server/db";
import { sendEmailWithDefaultConfig } from "@/notifications/email/services/smtp-service";
import { convert } from "@/features/unit-conversions/services/conversion-service";
import type { ToolDefinition, ToolResult, ToolRegistry } from "./types";

function createRegistry(): ToolRegistry {
  const tools = new Map<string, ToolDefinition>();

  const registry: ToolRegistry = {
    tools,

    register(tool: ToolDefinition) {
      tools.set(tool.name, tool);
    },

    async execute(name: string, params: Record<string, unknown>): Promise<ToolResult> {
      const tool = tools.get(name);
      if (!tool) {
        return { success: false, message: `Tool "${name}" not found` };
      }
      try {
        return await tool.handler(params);
      } catch (error) {
        console.error(`Tool execution error (${name}):`, error);
        return { success: false, message: `Error executing ${name}: ${error instanceof Error ? error.message : "Unknown error"}` };
      }
    },

    getTool(name: string) {
      return tools.get(name);
    },

    listTools() {
      return Array.from(tools.values());
    },
  };

  registry.register({
    name: "check-stock",
    description: "Check current stock level for an item",
    parameters: [
      { name: "item", type: "string", description: "Item name or SKU", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const item = params.item as string;
      const businessId = params.businessId as string;

      const catalogItem = await prisma.catalogItem.findFirst({
        where: {
          businessId,
          OR: [
            { name: { contains: item, mode: "insensitive" } },
            { sku: { contains: item, mode: "insensitive" } },
          ],
          isActive: true,
        },
        include: {
          balances: { include: { location: true } },
        },
      });

      if (!catalogItem) {
        return { success: false, message: `Item "${item}" not found in catalog.` };
      }

      const totalStock = catalogItem.balances.reduce((sum, b) => sum + Number(b.quantityOnHand), 0);

      return {
        success: true,
        message: `Stock for ${catalogItem.name}: ${totalStock} across ${catalogItem.balances.length} location(s).`,
        data: {
          itemName: catalogItem.name,
          sku: catalogItem.sku,
          totalStock,
          locations: catalogItem.balances.map((b) => ({
            location: b.location.name,
            quantity: Number(b.quantityOnHand),
            available: Number(b.quantityAvailable),
          })),
        },
      };
    },
  });

  registry.register({
    name: "check-price",
    description: "Check the price of an item",
    parameters: [
      { name: "item", type: "string", description: "Item name or SKU", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const item = params.item as string;
      const businessId = params.businessId as string;

      const catalogItem = await prisma.catalogItem.findFirst({
        where: {
          businessId,
          OR: [
            { name: { contains: item, mode: "insensitive" } },
            { sku: { contains: item, mode: "insensitive" } },
          ],
          isActive: true,
        },
      });

      if (!catalogItem) {
        return { success: false, message: `Item "${item}" not found.` };
      }

      return {
        success: true,
        message: `${catalogItem.name}: ${Number(catalogItem.price).toFixed(2)} ${catalogItem.currency}. Cost: ${catalogItem.costPrice ? Number(catalogItem.costPrice).toFixed(2) : "N/A"}.`,
        data: {
          itemName: catalogItem.name,
          price: Number(catalogItem.price),
          costPrice: catalogItem.costPrice ? Number(catalogItem.costPrice) : null,
          currency: catalogItem.currency,
        },
      };
    },
  });

  registry.register({
    name: "sell",
    description: "Record a sale transaction",
    parameters: [
      { name: "item", type: "string", description: "Item name", required: true },
      { name: "quantity", type: "number", description: "Quantity sold", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
      { name: "staffId", type: "string", description: "Staff ID", required: false },
      { name: "customerId", type: "string", description: "Customer ID", required: false },
    ],
    handler: async (params) => {
      const item = params.item as string;
      const quantity = Number(params.quantity);
      const businessId = params.businessId as string;
      const staffId = params.staffId as string | undefined;
      const customerId = params.customerId as string | undefined;

      if (!item || !quantity || quantity <= 0) {
        return { success: false, message: "Please specify item and valid quantity.", actionRequired: true };
      }

      const catalogItem = await prisma.catalogItem.findFirst({
        where: { businessId, name: { contains: item, mode: "insensitive" }, isActive: true },
        include: { balances: { take: 1 } },
      });

      if (!catalogItem) {
        return { success: false, message: `Item "${item}" not found.` };
      }

      const totalStock = catalogItem.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0);
      if (totalStock < quantity) {
        return { success: false, message: `Insufficient stock. Only ${totalStock} available.` };
      }

      const locationId = catalogItem.balances[0]?.locationId;
      if (!locationId) {
        return { success: false, message: "No inventory location configured." };
      }

      const unitPrice = Number(catalogItem.price);
      const total = quantity * unitPrice;

      const sale = await prisma.sale.create({
        data: {
          businessId,
          customerId: customerId || null,
          staffId: staffId || null,
          subtotal: total,
          total,
          status: "completed",
          items: {
            create: {
              catalogItemId: catalogItem.id,
              quantity,
              unitPrice,
              subtotal: total,
            },
          },
        },
      });

      await prisma.inventoryBalance.update({
        where: { locationId_catalogItemId_variantId: { locationId, catalogItemId: catalogItem.id, variantId: null } },
        data: {
          quantityOnHand: { decrement: quantity },
          quantityAvailable: { decrement: quantity },
        },
      });

      return {
        success: true,
        message: `Sale completed: ${quantity} x ${catalogItem.name} = ${total.toFixed(2)} ${catalogItem.currency}.`,
        data: { saleId: sale.id, total, itemName: catalogItem.name, quantity },
      };
    },
  });

  registry.register({
    name: "lookup-customer",
    description: "Look up a customer by name, phone, or email",
    parameters: [
      { name: "query", type: "string", description: "Customer name, phone, or email", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: false },
    ],
    handler: async (params) => {
      const query = params.query as string;
      const businessId = params.businessId as string | undefined;

      const where: Record<string, unknown> = {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      };
      if (businessId) where.businessId = businessId;

      const customers = await prisma.customer.findMany({
        where: where as Parameters<typeof prisma.customer.findMany>[0],
        take: 5,
        include: {
          customerGroup: { select: { name: true, discountPercent: true } },
          creditAccount: { select: { balance: true, creditLimit: true } },
          _count: { select: { sales: true } },
        },
      });

      if (customers.length === 0) {
        return { success: false, message: `No customers found matching "${query}".` };
      }

      return {
        success: true,
        message: `Found ${customers.length} customer(s).`,
        data: {
          customers: customers.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName || ""}`.trim(),
            phone: c.phone,
            email: c.email,
            group: c.customerGroup?.name,
            discount: c.customerGroup?.discountPercent ? Number(c.customerGroup.discountPercent) : 0,
            creditBalance: c.creditAccount ? Number(c.creditAccount.balance) : 0,
            creditLimit: c.creditAccount ? Number(c.creditAccount.creditLimit) : 0,
            totalPurchases: c._count.sales,
          })),
        },
      };
    },
  });

  registry.register({
    name: "add-customer",
    description: "Add a new customer",
    parameters: [
      { name: "name", type: "string", description: "Customer name", required: true },
      { name: "phone", type: "string", description: "Phone number", required: false },
      { name: "email", type: "string", description: "Email address", required: false },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const name = params.name as string;
      const phone = params.phone as string | undefined;
      const email = params.email as string | undefined;
      const businessId = params.businessId as string;

      const nameParts = name.split(" ");
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(" ") || null;

      const customer = await prisma.customer.create({
        data: { businessId, firstName, lastName, phone, email },
      });

      return {
        success: true,
        message: `Customer "${firstName} ${lastName || ""}" created successfully.`,
        data: { id: customer.id, firstName, lastName, phone, email },
      };
    },
  });

  registry.register({
    name: "view-orders",
    description: "View recent sales orders",
    parameters: [
      { name: "businessId", type: "string", description: "Business ID", required: true },
      { name: "limit", type: "number", description: "Number of orders to return", required: false },
    ],
    handler: async (params) => {
      const businessId = params.businessId as string;
      const limit = (params.limit as number) || 5;

      const orders = await prisma.sale.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          items: { take: 3 },
        },
      });

      return {
        success: true,
        message: `Found ${orders.length} recent order(s).`,
        data: {
          orders: orders.map((o) => ({
            id: o.id,
            total: Number(o.total),
            status: o.status,
            customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName || ""}`.trim() : "Walk-in",
            itemCount: o.items.length,
            date: o.createdAt.toISOString(),
          })),
        },
      };
    },
  });

  registry.register({
    name: "create-sale",
    description: "Create a new sale",
    parameters: [
      { name: "items", type: "array", description: "Array of {itemId, quantity} objects", required: true },
      { name: "customerId", type: "string", description: "Customer ID", required: false },
      { name: "staffId", type: "string", description: "Staff ID", required: false },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const businessId = params.businessId as string;
      const items = params.items as Array<{ itemId: string; quantity: number }>;
      const customerId = params.customerId as string | undefined;
      const staffId = params.staffId as string | undefined;

      if (!items || items.length === 0) {
        return { success: false, message: "No items provided for sale.", actionRequired: true };
      }

      let subtotal = 0;
      const saleItems: Array<{ catalogItemId: string; quantity: number; unitPrice: number; subtotal: number }> = [];

      for (const item of items) {
        const catalogItem = await prisma.catalogItem.findUnique({
          where: { id: item.itemId, businessId },
        });
        if (!catalogItem) {
          return { success: false, message: `Item ${item.itemId} not found.` };
        }
        const unitPrice = Number(catalogItem.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        saleItems.push({
          catalogItemId: catalogItem.id,
          quantity: item.quantity,
          unitPrice,
          subtotal: lineTotal,
        });
      }

      const sale = await prisma.sale.create({
        data: {
          businessId,
          customerId: customerId || null,
          staffId: staffId || null,
          subtotal,
          total: subtotal,
          status: "completed",
          items: { create: saleItems },
        },
      });

      return {
        success: true,
        message: `Sale #${sale.id.slice(0, 8)} created: ${formatCurrency(subtotal)}.`,
        data: { saleId: sale.id, total: subtotal, items: saleItems.length },
      };
    },
  });

  registry.register({
    name: "create-quotation",
    description: "Create a customer quotation",
    parameters: [
      { name: "customerId", type: "string", description: "Customer ID", required: true },
      { name: "items", type: "array", description: "Array of {itemId, quantity} objects", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const businessId = params.businessId as string;
      const customerId = params.customerId as string;
      const items = params.items as Array<{ itemId: string; quantity: number }>;

      if (!items || items.length === 0) {
        return { success: false, message: "No items provided.", actionRequired: true };
      }

      let total = 0;
      const qtItems: Array<{ catalogItemId: string; quantity: number; unitPrice: number; subtotal: number }> = [];

      for (const item of items) {
        const catalogItem = await prisma.catalogItem.findUnique({
          where: { id: item.itemId, businessId },
        });
        if (!catalogItem) continue;
        const unitPrice = Number(catalogItem.price);
        const lineTotal = unitPrice * item.quantity;
        total += lineTotal;
        qtItems.push({
          catalogItemId: catalogItem.id,
          quantity: item.quantity,
          unitPrice,
          subtotal: lineTotal,
        });
      }

      const quotation = await prisma.quotation.create({
        data: {
          businessId,
          customerId,
          subtotal: total,
          total,
          status: "draft",
          items: { create: qtItems },
        },
      });

      return {
        success: true,
        message: `Quotation #${quotation.id.slice(0, 8)} created: ${formatCurrency(total)}.`,
        data: { quotationId: quotation.id, total },
      };
    },
  });

  registry.register({
    name: "create-invoice",
    description: "Create an invoice",
    parameters: [
      { name: "customerId", type: "string", description: "Customer ID", required: true },
      { name: "items", type: "array", description: "Array of {itemId, quantity} objects", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const businessId = params.businessId as string;
      const customerId = params.customerId as string;
      const items = params.items as Array<{ itemId: string; quantity: number }>;

      let total = 0;
      const invItems: Array<{ catalogItemId: string; quantity: number; unitPrice: number; subtotal: number }> = [];

      for (const item of items) {
        const catalogItem = await prisma.catalogItem.findUnique({
          where: { id: item.itemId, businessId },
        });
        if (!catalogItem) continue;
        const unitPrice = Number(catalogItem.price);
        const lineTotal = unitPrice * item.quantity;
        total += lineTotal;
        invItems.push({
          catalogItemId: catalogItem.id,
          quantity: item.quantity,
          unitPrice,
          subtotal: lineTotal,
        });
      }

      const invoice = await prisma.invoice.create({
        data: {
          businessId,
          customerId,
          subtotal: total,
          total,
          status: "pending",
          items: { create: invItems },
        },
      });

      return {
        success: true,
        message: `Invoice #${invoice.id.slice(0, 8)} created: ${formatCurrency(total)}.`,
        data: { invoiceId: invoice.id, total },
      };
    },
  });

  registry.register({
    name: "create-return",
    description: "Create a sales return",
    parameters: [
      { name: "saleId", type: "string", description: "Sale ID", required: true },
      { name: "items", type: "array", description: "Array of {itemId, quantity} objects", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const businessId = params.businessId as string;
      const saleId = params.saleId as string;
      const items = params.items as Array<{ itemId: string; quantity: number }>;

      const sale = await prisma.sale.findUnique({
        where: { id: saleId, businessId },
        include: { items: true },
      });
      if (!sale) {
        return { success: false, message: "Sale not found." };
      }

      const returnRecord = await prisma.return.create({
        data: {
          businessId,
          saleId,
          status: "completed",
          items: {
            create: items.map((item) => ({
              catalogItemId: item.itemId,
              quantity: item.quantity,
              unitPrice: 0,
              subtotal: 0,
            })),
          },
        },
      });

      return {
        success: true,
        message: `Return #${returnRecord.id.slice(0, 8)} created.`,
        data: { returnId: returnRecord.id },
      };
    },
  });

  registry.register({
    name: "transfer-stock",
    description: "Transfer stock between locations",
    parameters: [
      { name: "itemId", type: "string", description: "Item ID", required: true },
      { name: "quantity", type: "number", description: "Quantity to transfer", required: true },
      { name: "fromLocationId", type: "string", description: "Source location ID", required: true },
      { name: "toLocationId", type: "string", description: "Destination location ID", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const itemId = params.itemId as string;
      const quantity = Number(params.quantity);
      const fromLocationId = params.fromLocationId as string;
      const toLocationId = params.toLocationId as string;
      const businessId = params.businessId as string;

      const fromBalance = await prisma.inventoryBalance.findUnique({
        where: { locationId_catalogItemId_variantId: { locationId: fromLocationId, catalogItemId: itemId, variantId: null } },
      });
      if (!fromBalance || Number(fromBalance.quantityOnHand) < quantity) {
        return { success: false, message: "Insufficient stock at source location." };
      }

      const transfer = await prisma.stockTransfer.create({
        data: {
          businessId,
          fromLocationId,
          toLocationId,
          status: "completed",
          items: {
            create: { catalogItemId: itemId, quantity },
          },
        },
      });

      await prisma.inventoryBalance.update({
        where: { locationId_catalogItemId_variantId: { locationId: fromLocationId, catalogItemId: itemId, variantId: null } },
        data: { quantityOnHand: { decrement: quantity }, quantityAvailable: { decrement: quantity } },
      });

      const toBalance = await prisma.inventoryBalance.findUnique({
        where: { locationId_catalogItemId_variantId: { locationId: toLocationId, catalogItemId: itemId, variantId: null } },
      });
      if (toBalance) {
        await prisma.inventoryBalance.update({
          where: { locationId_catalogItemId_variantId: { locationId: toLocationId, catalogItemId: itemId, variantId: null } },
          data: { quantityOnHand: { increment: quantity }, quantityAvailable: { increment: quantity } },
        });
      }

      return {
        success: true,
        message: `Transferred ${quantity} units.`,
        data: { transferId: transfer.id },
      };
    },
  });

  registry.register({
    name: "adjust-stock",
    description: "Adjust stock quantity",
    parameters: [
      { name: "itemId", type: "string", description: "Item ID", required: true },
      { name: "quantity", type: "number", description: "New quantity", required: true },
      { name: "locationId", type: "string", description: "Location ID", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const itemId = params.itemId as string;
      const quantity = Number(params.quantity);
      const locationId = params.locationId as string;

      const balance = await prisma.inventoryBalance.findUnique({
        where: { locationId_catalogItemId_variantId: { locationId, catalogItemId: itemId, variantId: null } },
      });
      if (!balance) {
        return { success: false, message: "No balance record found." };
      }

      await prisma.inventoryBalance.update({
        where: { locationId_catalogItemId_variantId: { locationId, catalogItemId: itemId, variantId: null } },
        data: { quantityOnHand: quantity, quantityAvailable: quantity },
      });

      return {
        success: true,
        message: `Stock adjusted to ${quantity}.`,
        data: { itemId, newQuantity: quantity },
      };
    },
  });

  registry.register({
    name: "create-purchase-order",
    description: "Create a purchase order",
    parameters: [
      { name: "supplierId", type: "string", description: "Supplier ID", required: true },
      { name: "items", type: "array", description: "Array of {itemId, quantity, unitCost} objects", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const businessId = params.businessId as string;
      const supplierId = params.supplierId as string;
      const items = params.items as Array<{ itemId: string; quantity: number; unitCost: number }>;

      let total = 0;
      const poItems = items.map((item) => {
        const subtotal = item.quantity * item.unitCost;
        total += subtotal;
        return { catalogItemId: item.itemId, quantity: item.quantity, unitCost: item.unitCost, subtotal };
      });

      const po = await prisma.purchaseOrder.create({
        data: {
          businessId,
          supplierId,
          subtotal: total,
          total,
          status: "draft",
          items: { create: poItems },
        },
      });

      return {
        success: true,
        message: `Purchase Order #${po.id.slice(0, 8)} created: ${formatCurrency(total)}.`,
        data: { poId: po.id, total },
      };
    },
  });

  registry.register({
    name: "check-wallet",
    description: "Check subscription wallet balance",
    parameters: [
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const businessId = params.businessId as string;
      const wallet = await prisma.subscriptionWallet.findUnique({
        where: { businessId },
      });

      return {
        success: true,
        message: wallet
          ? `Wallet balance: ${formatCurrency(Number(wallet.balance))}.`
          : "No wallet found.",
        data: { balance: wallet ? Number(wallet.balance) : 0 },
      };
    },
  });

  registry.register({
    name: "view-report",
    description: "Generate a business report",
    parameters: [
      { name: "type", type: "string", description: "Report type (sales, stock, staff, customers, profit)", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
      { name: "days", type: "number", description: "Days to look back", required: false },
    ],
    handler: async (params) => {
      const type = params.type as string;
      const businessId = params.businessId as string;
      const days = (params.days as number) || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      switch (type) {
        case "sales": {
          const sales = await prisma.sale.findMany({
            where: { businessId, createdAt: { gte: startDate } },
          });
          const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
          return {
            success: true,
            message: `Sales report (${days} days): ${sales.length} transactions, ${formatCurrency(totalRevenue)} total.`,
            data: { count: sales.length, total: totalRevenue, period: days },
          };
        }
        case "profit": {
          const sales = await prisma.sale.findMany({
            where: { businessId, createdAt: { gte: startDate } },
            include: { items: { include: { catalogItem: { select: { costPrice: true } } } } },
          });
          let revenue = 0, cost = 0;
          for (const sale of sales) {
            revenue += Number(sale.total);
            for (const item of sale.items) {
              cost += Number(item.quantity) * Number(item.catalogItem.costPrice || 0);
            }
          }
          const profit = revenue - cost;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
          return {
            success: true,
            message: `Profit report: Revenue ${formatCurrency(revenue)}, Cost ${formatCurrency(cost)}, Profit ${formatCurrency(profit)} (${margin.toFixed(1)}% margin).`,
            data: { revenue, cost, profit, margin: Math.round(margin * 100) / 100 },
          };
        }
        case "stock": {
          const items = await prisma.catalogItem.findMany({
            where: { businessId, trackStock: true },
            include: { balances: true },
          });
          const totalItems = items.length;
          const totalValue = items.reduce((s, i) => s + Number(i.price) * i.balances.reduce((bs, b) => bs + Number(b.quantityOnHand), 0), 0);
          const lowStock = items.filter((i) => i.balances.some((b) => Number(b.quantityOnHand) <= Number(b.reorderPoint) && Number(b.reorderPoint) > 0)).length;
          return {
            success: true,
            message: `Stock report: ${totalItems} items, ${formatCurrency(totalValue)} total value, ${lowStock} low stock alerts.`,
            data: { totalItems, totalValue, lowStock },
          };
        }
        case "staff":
          return {
            success: true,
            message: `Staff report: Use the staff management page for detailed information.`,
            data: { type: "staff" },
          };
        default:
          return { success: false, message: `Unknown report type: ${type}` };
      }
    },
  });

  registry.register({
    name: "check-staff",
    description: "Look up staff information",
    parameters: [
      { name: "name", type: "string", description: "Staff name", required: false },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const name = params.name as string | undefined;
      const businessId = params.businessId as string;

      const where: Record<string, unknown> = { businessId };
      if (name) {
        where.user = {
          OR: [
            { firstName: { contains: name, mode: "insensitive" } },
            { lastName: { contains: name, mode: "insensitive" } },
          ],
        };
      }

      const staff = await prisma.staff.findMany({
        where: where as Parameters<typeof prisma.staff.findMany>[0],
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          assignments: { include: { role: { select: { name: true } }, branch: { select: { name: true } } }, take: 3 },
        },
        take: 10,
      });

      return {
        success: true,
        message: `Found ${staff.length} staff member(s).`,
        data: {
          staff: staff.map((s) => ({
            name: `${s.user.firstName} ${s.user.lastName}`,
            email: s.user.email,
            position: s.position,
            code: s.employeeCode,
            assignments: s.assignments.map((a) => ({
              role: a.role?.name,
              branch: a.branch?.name,
            })),
          })),
        },
      };
    },
  });

  registry.register({
    name: "send-notification",
    description: "Send a notification to a user",
    parameters: [
      { name: "userId", type: "string", description: "User ID", required: true },
      { name: "title", type: "string", description: "Notification title", required: true },
      { name: "message", type: "string", description: "Notification message", required: true },
      { name: "businessId", type: "string", description: "Business ID", required: true },
    ],
    handler: async (params) => {
      const userId = params.userId as string;
      const title = params.title as string;
      const message = params.message as string;
      const businessId = params.businessId as string;

      await prisma.notification.create({
        data: { userId, businessId, type: "system", title, message },
      });

      return { success: true, message: "Notification sent." };
    },
  });

  registry.register({
    name: "send-email",
    description: "Send an email",
    parameters: [
      { name: "to", type: "string", description: "Recipient email", required: true },
      { name: "subject", type: "string", description: "Email subject", required: true },
      { name: "html", type: "string", description: "HTML content", required: true },
    ],
    handler: async (params) => {
      const to = params.to as string;
      const subject = params.subject as string;
      const html = params.html as string;

      const result = await sendEmailWithDefaultConfig({ to, subject, html });
      if (!result.success) {
        return { success: false, message: result.error || "Failed to send email" };
      }

      return { success: true, message: `Email sent to ${to}.` };
    },
  });

  return registry;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(value);
}

export const toolRegistry = createRegistry();
