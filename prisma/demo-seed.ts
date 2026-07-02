import { PrismaClient, Prisma, type CatalogItemType, type CustomerType } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@2024!";

async function main() {
  console.log("Seeding demo data...\n");

  // ── 1. Demo User ──────────────────────────────────────────────────────────
  const demoEmail = "demo@enkaibusiness.com";
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoUser) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        firstName: "Demo",
        lastName: "User",
        name: "Demo User",
        username: "demo",
        phone: "255700000001",
        gender: "male",
        isActive: true,
        isOnboarded: true,
        emailVerified: true,
      },
    });
    await prisma.account.create({
      data: {
        id: `account-${demoUser.id}`,
        userId: demoUser.id,
        accountId: demoUser.id,
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✔ Created demo user:", demoEmail);
  } else {
    console.log("✔ Demo user already exists:", demoEmail);
  }

  // ── 2. Workspace ──────────────────────────────────────────────────────────
  let workspace = await prisma.workspace.findUnique({ where: { slug: "enkai-demo" } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Enkai Demo",
        slug: "enkai-demo",
        description: "Demo workspace for client presentations",
        isActive: true,
      },
    });
    console.log("✔ Created workspace:", workspace.name);
  } else {
    console.log("✔ Workspace already exists:", workspace.name);
  }

  // Ensure demo user is a member of the workspace
  const existingMember = await prisma.workspaceMember.findFirst({
    where: { userId: demoUser.id, workspaceId: workspace.id },
  });
  if (!existingMember) {
    await prisma.workspaceMember.create({
      data: {
        userId: demoUser.id,
        workspaceId: workspace.id,
        role: "ADMIN",
      },
    });
    console.log("✔ Added demo user to workspace as ADMIN");
  }

  // ── 3. Subscription Plan ─────────────────────────────────────────────────
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { slug: "monthly-500" },
  });
  if (!plan) {
    console.log("✖ Monthly Biashara plan not found. Run prisma db seed first.");
    return;
  }

  // ── 4. Business ──────────────────────────────────────────────────────────
  let business = await prisma.business.findFirst({
    where: { slug: "enkai-demo-shop", workspaceId: workspace.id },
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        workspaceId: workspace.id,
        name: "Enkai Demo Shop",
        slug: "enkai-demo-shop",
        email: "info@enkai-demo.co.tz",
        phone: "255700000002",
        address: "123 Mtaa wa Demo, Dar es Salaam",
        currency: "TZS",
        timezone: "Africa/Dar_es_Salaam",
        isActive: true,
        status: "ACTIVE",
        createdById: demoUser.id,
        updatedById: demoUser.id,
      },
    });

    // Business modes
    await prisma.businessMode.create({
      data: { businessId: business.id, industry: "COMMERCE", mode: "retail", isActive: true },
    });
    const busType = await prisma.businessType.findUnique({ where: { slug: "commerce" } });
    if (busType) {
      await prisma.business.update({
        where: { id: business.id },
        data: { businessTypeId: busType.id },
      });
    }

    // Assign "owner" role
    const ownerRole = await prisma.role.findUnique({ where: { slug: "owner" } });
    if (ownerRole) {
      await prisma.userRole.create({
        data: {
          userId: demoUser.id,
          roleId: ownerRole.id,
          businessId: business.id,
        },
      });
    }

    // Subscription
    await prisma.subscription.create({
      data: {
        planId: plan.id,
        businessId: business.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Subscription wallet
    await prisma.subscriptionWallet.create({
      data: {
        businessId: business.id,
        balance: new Prisma.Decimal(50000),
        totalDeposited: new Prisma.Decimal(50000),
      },
    });

    console.log("✔ Created business:", business.name);
  } else {
    console.log("✔ Business already exists:", business.name);
  }

  // ── 5. Branch ────────────────────────────────────────────────────────────
  let branch = await prisma.branch.findFirst({
    where: { businessId: business.id, name: "Main Branch" },
  });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        businessId: business.id,
        name: "Main Branch",
        code: "MBN-001",
        email: "branch@enkai-demo.co.tz",
        phone: "255700000003",
        address: "456 Branch Street, Kariakoo, Dar es Salaam",
        city: "Dar es Salaam",
        country: "Tanzania",
        isHeadOffice: true,
        isActive: true,
        openingTime: "08:00",
        closingTime: "20:00",
      },
    });
    console.log("✔ Created branch:", branch.name);
  } else {
    console.log("✔ Branch already exists:", branch.name);
  }

  // ── 6. Staff ─────────────────────────────────────────────────────────────
  let staff = await prisma.staff.findFirst({
    where: { userId: demoUser.id, businessId: business.id },
  });
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        userId: demoUser.id,
        businessId: business.id,
        employeeCode: "EMP-001",
        position: "Manager",
        hireDate: new Date("2025-01-01"),
        isActive: true,
      },
    });
    await prisma.staffAssignment.create({
      data: {
        staffId: staff.id,
        level: "branch",
        businessId: business.id,
        branchId: branch.id,
      },
    });
    console.log("✔ Created staff:", staff.employeeCode);
  } else {
    console.log("✔ Staff already exists");
  }

  // ── 7. Inventory Location ────────────────────────────────────────────────
  let invLocation = await prisma.inventoryLocation.findFirst({
    where: { businessId: business.id, branchId: branch.id, type: "branch" },
  });
  if (!invLocation) {
    invLocation = await prisma.inventoryLocation.create({
      data: {
        businessId: business.id,
        branchId: branch.id,
        name: "Main Branch Stock",
        type: "branch",
        isActive: true,
      },
    });
    console.log("✔ Created inventory location");
  }

  // Walk-in customer
  const walkinCustomer = await prisma.customer.findFirst({
    where: { businessId: business.id, customerType: "WALK_IN" },
  });
  if (!walkinCustomer) {
    await prisma.customer.create({
      data: {
        businessId: business.id,
        customerType: "WALK_IN",
        firstName: "Walk-In",
        lastName: "Customer",
        isActive: true,
      },
    });
  }

  // Cash payment method
  const cashPm = await prisma.paymentMethod.findFirst({
    where: { businessId: business.id, type: "cash" },
  });
  if (!cashPm) {
    await prisma.paymentMethod.create({
      data: {
        businessId: business.id,
        name: "Cash",
        type: "cash",
        isActive: true,
      },
    });
  }
  const cashPaymentMethod = await prisma.paymentMethod.findFirstOrThrow({
    where: { businessId: business.id, type: "cash" },
  });

  // ── 8. Demo Categories ────────────────────────────────────────────────────
  const categories: { name: string; description: string }[] = [
    { name: "Food & Beverages", description: "Food items, grains, oils, and drinks" },
    { name: "Household & Personal Care", description: "Cleaning products and personal care items" },
    { name: "Energy", description: "Cooking gas and fuel" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let cat = await prisma.category.findFirst({
      where: { businessId: business.id, slug },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          businessId: business.id,
          name: c.name,
          slug,
          description: c.description,
          isActive: true,
        },
      });
      console.log(`  ✔ Created category: ${c.name}`);
    }
    categoryMap[c.name] = cat.id;
  }

  // ── 9. Demo Units ─────────────────────────────────────────────────────────
  const units: { name: string; abbreviation: string; type: string }[] = [
    { name: "Piece", abbreviation: "pcs", type: "count" },
    { name: "Kilogram", abbreviation: "kg", type: "weight" },
    { name: "Gram", abbreviation: "g", type: "weight" },
    { name: "Liter", abbreviation: "L", type: "volume" },
    { name: "Milliliter", abbreviation: "ml", type: "volume" },
  ];

  const unitMap: Record<string, string> = {};
  for (const u of units) {
    let unit = await prisma.unit.findFirst({
      where: { businessId: business.id, name: u.name },
    });
    if (!unit) {
      unit = await prisma.unit.create({
        data: {
          businessId: business.id,
          name: u.name,
          abbreviation: u.abbreviation,
          type: u.type,
        },
      });
      console.log(`  ✔ Created unit: ${u.name} (${u.abbreviation})`);
    }
    unitMap[u.name] = unit.id;
  }

  // ── 10. Demo Products ─────────────────────────────────────────────────────
  const products: { name: string; sku: string; price: number; cost: number; category: string; unit: string; itemType: CatalogItemType; trackStock: boolean }[] = [
    { name: "White Sugar (1kg)", sku: "SUG-001", price: 3500, cost: 3000, category: "Food & Beverages", unit: "Kilogram", itemType: "PRODUCT", trackStock: true },
    { name: "Cooking Oil (2L)", sku: "OIL-002", price: 7000, cost: 6200, category: "Food & Beverages", unit: "Liter", itemType: "PRODUCT", trackStock: true },
    { name: "Maize Flour (5kg)", sku: "FLR-003", price: 6500, cost: 5600, category: "Food & Beverages", unit: "Kilogram", itemType: "PRODUCT", trackStock: true },
    { name: "Rice Pishori (5kg)", sku: "RIC-004", price: 12000, cost: 10500, category: "Food & Beverages", unit: "Kilogram", itemType: "PRODUCT", trackStock: true },
    { name: "Sea Salt (1kg)", sku: "SLT-005", price: 1000, cost: 700, category: "Food & Beverages", unit: "Kilogram", itemType: "PRODUCT", trackStock: true },
    { name: "Chai Tea Leaves (500g)", sku: "TEA-006", price: 4500, cost: 3800, category: "Food & Beverages", unit: "Gram", itemType: "PRODUCT", trackStock: true },
    { name: "Bar Soap (200g)", sku: "SOAP-007", price: 2500, cost: 1900, category: "Household & Personal Care", unit: "Piece", itemType: "PRODUCT", trackStock: true },
    { name: "Toothpaste (100g)", sku: "TP-008", price: 3000, cost: 2400, category: "Household & Personal Care", unit: "Piece", itemType: "PRODUCT", trackStock: true },
    { name: "Mineral Water (1.5L)", sku: "WTR-009", price: 1500, cost: 1000, category: "Food & Beverages", unit: "Liter", itemType: "PRODUCT", trackStock: true },
    { name: "Brown Bread (Loaf)", sku: "BRD-010", price: 2000, cost: 1500, category: "Food & Beverages", unit: "Piece", itemType: "PRODUCT", trackStock: true },
    { name: "Detergent (1kg)", sku: "DET-011", price: 5500, cost: 4200, category: "Household & Personal Care", unit: "Kilogram", itemType: "PRODUCT", trackStock: true },
    { name: "Cooking Gas (6kg)", sku: "GAS-012", price: 25000, cost: 22000, category: "Energy", unit: "Kilogram", itemType: "PRODUCT", trackStock: true },
  ];

  const catalogItemIds: Record<string, string> = {};
  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let item = await prisma.catalogItem.findUnique({
      where: { businessId_slug: { businessId: business.id, slug } },
    });
    if (!item) {
      item = await prisma.catalogItem.create({
        data: {
          businessId: business.id,
          name: p.name,
          slug,
          sku: p.sku,
          itemType: p.itemType,
          categoryId: categoryMap[p.category],
          unitId: unitMap[p.unit],
          price: new Prisma.Decimal(p.price),
          costPrice: new Prisma.Decimal(p.cost),
          isService: false,
          trackStock: p.trackStock,
          isActive: true,
          createdById: demoUser.id,
          updatedById: demoUser.id,
        },
      });
      // Create inventory balance
      await prisma.inventoryBalance.create({
        data: {
          locationId: invLocation!.id,
          catalogItemId: item.id,
          quantityOnHand: new Prisma.Decimal(0),
          quantityAvailable: new Prisma.Decimal(0),
          quantityCommitted: new Prisma.Decimal(0),
        },
      });
      console.log(`  ✔ Created product: ${p.name} (${p.price} TZS)`);
    }
    catalogItemIds[p.sku] = item.id;
  }

  // ── 9. Demo Suppliers ────────────────────────────────────────────────────
  const suppliers: { name: string; phone: string; city: string; paymentTerms: string }[] = [
    { name: "Bidco Tanzania Ltd", phone: "255700000010", city: "Dar es Salaam", paymentTerms: "Net 30" },
    { name: "Azam Foods", phone: "255700000011", city: "Dar es Salaam", paymentTerms: "Net 15" },
    { name: "TBL Distributors", phone: "255700000012", city: "Dar es Salaam", paymentTerms: "Cash on Delivery" },
  ];

  const supplierIds: Record<string, string> = {};
  for (const s of suppliers) {
    let supplier = await prisma.supplier.findFirst({
      where: { businessId: business.id, name: s.name },
    });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          businessId: business.id,
          supplierType: "local",
          name: s.name,
          phone: s.phone,
          city: s.city,
          country: "Tanzania",
          paymentTerms: s.paymentTerms,
          isActive: true,
        },
      });
      console.log(`  ✔ Created supplier: ${s.name}`);
    }
    supplierIds[s.name] = supplier.id;
  }

  // ── 10. Demo Customers ───────────────────────────────────────────────────
  const customers: { firstName: string; lastName: string; phone: string; customerType: CustomerType }[] = [
    { firstName: "Juma", lastName: "Mkali", phone: "255700000020", customerType: "RETAIL" },
    { firstName: "Asha", lastName: "Salum", phone: "255700000021", customerType: "RETAIL" },
    { firstName: "Mussa", lastName: "Hamisi", phone: "255700000022", customerType: "WHOLESALE" },
    { firstName: "Halima", lastName: "Kassim", phone: "255700000023", customerType: "RETAIL" },
  ];

  const customerIds: string[] = [];
  for (const c of customers) {
    let customer = await prisma.customer.findFirst({
      where: { businessId: business.id, phone: c.phone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId: business.id,
          customerType: c.customerType,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          isActive: true,
        },
      });
      console.log(`  ✔ Created customer: ${c.firstName} ${c.lastName}`);
    }
    customerIds.push(customer.id);
  }

  // ── 11. Demo Purchases ───────────────────────────────────────────────────
  const now = new Date();
  const purchases: {
    supplier: string;
    date: Date;
    items: { sku: string; qty: number; cost: number }[];
  }[] = [
    {
      supplier: "Bidco Tanzania Ltd",
      date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      items: [
        { sku: "OIL-002", qty: 50, cost: 6200 },
        { sku: "SOAP-007", qty: 100, cost: 1900 },
        { sku: "DET-011", qty: 30, cost: 4200 },
      ],
    },
    {
      supplier: "Azam Foods",
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      items: [
        { sku: "SUG-001", qty: 100, cost: 3000 },
        { sku: "FLR-003", qty: 40, cost: 5600 },
        { sku: "RIC-004", qty: 30, cost: 10500 },
        { sku: "TEA-006", qty: 60, cost: 3800 },
      ],
    },
    {
      supplier: "TBL Distributors",
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      items: [
        { sku: "SLT-005", qty: 200, cost: 700 },
        { sku: "WTR-009", qty: 100, cost: 1000 },
        { sku: "GAS-012", qty: 15, cost: 22000 },
      ],
    },
  ];

  let purchaseCount = 0;
  for (const p of purchases) {
    const ref = `PO-DEMO-${String(purchaseCount + 1).padStart(3, "0")}`;
    const existing = await prisma.purchase.findFirst({
      where: { businessId: business.id, reference: ref },
    });
    if (existing) continue;

    let subtotal = new Prisma.Decimal(0);
    for (const item of p.items) {
      subtotal = subtotal.plus(new Prisma.Decimal(item.qty).times(new Prisma.Decimal(item.cost)));
    }
    const tax = subtotal.times(new Prisma.Decimal(0.18));

    const purchase = await prisma.purchase.create({
      data: {
        workspaceId: workspace.id,
        businessId: business.id,
        branchId: branch.id,
        supplierId: supplierIds[p.supplier],
        staffId: staff!.id,
        purchaseDate: p.date,
        reference: ref,
        status: "completed",
        paidAmount: subtotal.plus(tax),
        dueDate: new Date(p.date.getTime() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        tax,
        total: subtotal.plus(tax),
        createdById: demoUser.id,
      },
    });

    for (const item of p.items) {
      const itemSubtotal = new Prisma.Decimal(item.qty).times(new Prisma.Decimal(item.cost));
      await prisma.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          catalogItemId: catalogItemIds[item.sku],
          quantity: new Prisma.Decimal(item.qty),
          unitCost: new Prisma.Decimal(item.cost),
          subtotal: itemSubtotal,
        },
      });

      const balance = await prisma.inventoryBalance.findFirst({
        where: { locationId: invLocation!.id, catalogItemId: catalogItemIds[item.sku] },
      });
      const balanceBefore = balance?.quantityOnHand ?? new Prisma.Decimal(0);
      const balanceAfter = balanceBefore.plus(new Prisma.Decimal(item.qty));

      if (balance) {
        await prisma.inventoryBalance.update({
          where: { id: balance.id },
          data: {
            quantityOnHand: balanceAfter,
            quantityAvailable: balance.quantityAvailable.plus(new Prisma.Decimal(item.qty)),
          },
        });
      }

      // Stock movement
      await prisma.stockMovement.create({
        data: {
          catalogItemId: catalogItemIds[item.sku],
          locationId: invLocation!.id,
          quantityChange: new Prisma.Decimal(item.qty),
          balanceBefore,
          balanceAfter,
          reference: ref,
          referenceType: "purchase",
          createdById: demoUser.id,
        },
      });

      // Update catalog item cost price (weighted average)
      const catalogItem = await prisma.catalogItem.findUnique({ where: { id: catalogItemIds[item.sku] } });
      if (catalogItem && catalogItem.costPrice) {
        const totalCost = catalogItem.costPrice.times(new Prisma.Decimal(item.qty));
        // Simplified: set cost price to purchase cost
        await prisma.catalogItem.update({
          where: { id: catalogItemIds[item.sku] },
          data: { costPrice: new Prisma.Decimal(item.cost) },
        });
      }
    }

    // Payment for purchase
    await prisma.payment.create({
      data: {
        businessId: business.id,
        workspaceId: workspace.id,
        branchId: branch.id,
        paymentMethodId: cashPaymentMethod.id,
        amount: subtotal.plus(tax),
        reference: `PAY-${ref}`,
        paidAt: p.date,
        status: "completed",
        purchaseId: purchase.id,
        createdById: demoUser.id,
      },
    });

    purchaseCount++;
    console.log(`  ✔ Created purchase: ${ref} (${p.items.length} items)`);
  }

  // ── 12. Demo Sales ───────────────────────────────────────────────────────
  const salesData: {
    date: Date;
    customer: number;
    items: { sku: string; qty: number; price: number }[];
    isCash: boolean;
  }[] = [
    {
      date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      customer: 0,
      items: [
        { sku: "SUG-001", qty: 3, price: 3500 },
        { sku: "OIL-002", qty: 2, price: 7000 },
        { sku: "WTR-009", qty: 5, price: 1500 },
      ],
      isCash: true,
    },
    {
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      customer: 1,
      items: [
        { sku: "FLR-003", qty: 2, price: 6500 },
        { sku: "SUG-001", qty: 1, price: 3500 },
        { sku: "TEA-006", qty: 1, price: 4500 },
        { sku: "SLT-005", qty: 1, price: 1000 },
      ],
      isCash: true,
    },
    {
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      customer: 2,
      items: [
        { sku: "SUG-001", qty: 20, price: 3400 },
        { sku: "OIL-002", qty: 10, price: 6800 },
        { sku: "FLR-003", qty: 8, price: 6300 },
        { sku: "RIC-004", qty: 10, price: 11500 },
      ],
      isCash: false,
    },
    {
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      customer: 3,
      items: [
        { sku: "SOAP-007", qty: 3, price: 2500 },
        { sku: "TP-008", qty: 2, price: 3000 },
        { sku: "DET-011", qty: 1, price: 5500 },
        { sku: "BRD-010", qty: 2, price: 2000 },
      ],
      isCash: true,
    },
    {
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      customer: 0,
      items: [
        { sku: "GAS-012", qty: 1, price: 25000 },
        { sku: "WTR-009", qty: 3, price: 1500 },
      ],
      isCash: true,
    },
    {
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      customer: 1,
      items: [
        { sku: "SUG-001", qty: 2, price: 3500 },
        { sku: "OIL-002", qty: 1, price: 7000 },
        { sku: "FLR-003", qty: 1, price: 6500 },
        { sku: "TEA-006", qty: 2, price: 4500 },
        { sku: "BRD-010", qty: 3, price: 2000 },
        { sku: "SOAP-007", qty: 2, price: 2500 },
      ],
      isCash: true,
    },
    {
      date: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000),
      customer: 2,
      items: [
        { sku: "RIC-004", qty: 5, price: 11800 },
        { sku: "OIL-002", qty: 5, price: 6900 },
        { sku: "DET-011", qty: 5, price: 5200 },
      ],
      isCash: false,
    },
    {
      date: new Date(),
      customer: 3,
      items: [
        { sku: "WTR-009", qty: 2, price: 1500 },
        { sku: "BRD-010", qty: 2, price: 2000 },
        { sku: "SOAP-007", qty: 1, price: 2500 },
      ],
      isCash: true,
    },
  ];

  const saleCount = await prisma.sale.count({ where: { businessId: business.id } });
  if (saleCount === 0) {
    for (const sd of salesData) {
      const ref = `INV-DEMO-${String(salesData.indexOf(sd) + 1).padStart(3, "0")}`;
      let subtotal = new Prisma.Decimal(0);
      let totalCost = new Prisma.Decimal(0);

      for (const item of sd.items) {
        const lineTotal = new Prisma.Decimal(item.qty).times(new Prisma.Decimal(item.price));
        subtotal = subtotal.plus(lineTotal);
        const catalogItem = await prisma.catalogItem.findUnique({ where: { id: catalogItemIds[item.sku] } });
        if (catalogItem?.costPrice) {
          totalCost = totalCost.plus(new Prisma.Decimal(item.qty).times(catalogItem.costPrice));
        }
      }
      const grandTotal = subtotal;

      const sale = await prisma.sale.create({
        data: {
          workspaceId: workspace.id,
          businessId: business.id,
          branchId: branch.id,
          customerId: customerIds[sd.customer],
          staffId: staff!.id,
          saleDate: sd.date,
          reference: ref,
          status: "completed",
          subtotal,
          discountTotal: new Prisma.Decimal(0),
          taxTotal: new Prisma.Decimal(0),
          grandTotal,
          createdById: demoUser.id,
        },
      });

      for (const item of sd.items) {
        const lineTotal = new Prisma.Decimal(item.qty).times(new Prisma.Decimal(item.price));
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            catalogItemId: catalogItemIds[item.sku],
            quantity: new Prisma.Decimal(item.qty),
            unitPrice: new Prisma.Decimal(item.price),
            discount: new Prisma.Decimal(0),
            subtotal: lineTotal,
          },
        });

        // Deduct inventory
        const saleBalance = await prisma.inventoryBalance.findFirst({
          where: { locationId: invLocation!.id, catalogItemId: catalogItemIds[item.sku] },
        });
        const saleBalanceBefore = saleBalance?.quantityOnHand ?? new Prisma.Decimal(0);
        const saleBalanceAfter = saleBalanceBefore.minus(new Prisma.Decimal(item.qty));

        if (saleBalance) {
          await prisma.inventoryBalance.update({
            where: { id: saleBalance.id },
            data: {
              quantityOnHand: saleBalanceAfter,
              quantityAvailable: saleBalance.quantityAvailable.minus(new Prisma.Decimal(item.qty)),
            },
          });
        }
        await prisma.stockMovement.create({
          data: {
            catalogItemId: catalogItemIds[item.sku],
            locationId: invLocation!.id,
            quantityChange: new Prisma.Decimal(-item.qty),
            balanceBefore: saleBalanceBefore,
            balanceAfter: saleBalanceAfter,
            reference: ref,
            referenceType: "sale",
            createdById: demoUser.id,
          },
        });
      }

      // Invoice
      await prisma.invoice.create({
        data: {
          workspaceId: workspace.id,
          businessId: business.id,
          branchId: branch.id,
          customerId: customerIds[sd.customer],
          saleId: sale.id,
          invoiceDate: sd.date,
          dueDate: sd.isCash ? sd.date : new Date(sd.date.getTime() + 14 * 24 * 60 * 60 * 1000),
          invoiceNumber: ref,
          status: sd.isCash ? "paid" : "unpaid",
          subtotal,
          tax: new Prisma.Decimal(0),
          total: grandTotal,
          paidAmount: sd.isCash ? grandTotal : new Prisma.Decimal(0),
          balanceDue: sd.isCash ? new Prisma.Decimal(0) : grandTotal,
        },
      });

      // Payment (if cash)
      if (sd.isCash) {
        await prisma.payment.create({
          data: {
            businessId: business.id,
            workspaceId: workspace.id,
            branchId: branch.id,
            paymentMethodId: cashPaymentMethod.id,
            customerId: customerIds[sd.customer],
            amount: grandTotal,
            reference: `RCP-${ref}`,
            paidAt: sd.date,
            status: "completed",
            saleId: sale.id,
            createdById: demoUser.id,
          },
        });
      }

      console.log(`  ✔ Created sale: ${ref} (${grandTotal.toFixed(0)} TZS)`);
    }
  } else {
    console.log("✔ Sales already seeded");
  }

  // ── 13. Summary ──────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  DEMO DATA SEEDED SUCCESSFULLY`);
  console.log(`═══════════════════════════════════════`);
  console.log(`  Login: ${demoEmail} / ${DEMO_PASSWORD}`);
  console.log(`  Business: ${business.name}`);
  console.log(`═══════════════════════════════════════\n`);
}

main()
  .catch((e) => {
    console.error("Demo seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
