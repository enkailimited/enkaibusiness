import "server-only";

import { prisma } from "@/server/db";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ProfitLossResult {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
  netProfit: number;
  netMargin: number;
  saleCount: number;
  expenseCount: number;
}

export interface CashFlowResult {
  openingBalance: number;
  inflows: {
    cashSales: number;
    customerCollections: number;
    otherInflows: number;
    totalInflows: number;
  };
  outflows: {
    supplierPayments: number;
    expenses: number;
    refunds: number;
    otherOutflows: number;
    totalOutflows: number;
  };
  closingBalance: number;
}

export interface InventoryValuationItem {
  catalogItemId: string;
  name: string;
  sku: string | null;
  quantityOnHand: number;
  unitCost: number;
  totalValue: number;
  categoryName: string | null;
  locationName: string;
}

export interface CategoryValuation {
  categoryName: string;
  totalValue: number;
  itemCount: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  operatingProfit: number;
  receivables: number;
  payables: number;
  inventoryValue: number;
  saleCount: number;
  staffCount: number;
}

export interface DashboardData {
  todaySales: number;
  todaySalesCount: number;
  monthlySales: number;
  monthlySalesCount: number;
  grossProfit: number;
  netProfit: number;
  receivablesTotal: number;
  payablesTotal: number;
  cashPosition: number;
  inventoryValue: number;
  lowStockCount: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCustomers: { name: string; total: number; count: number }[];
  topSuppliers: { name: string; total: number; count: number }[];
}

// ─── COGS Calculation (Snapshot Cost Method) ─────────────────────────────
// Uses SaleItem.costPrice which is captured at sale time. This ensures
// historical COGS remains stable even if catalog costPrice changes later.
// Falls back to current catalog costPrice if snapshot is null (migration).

async function calculateCOGS(
  businessId: string,
  startDate: Date,
  endDate: Date,
  branchId?: string,
): Promise<number> {
  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      status: "completed",
      saleDate: { gte: startDate, lte: endDate },
      ...(branchId ? { branchId } : {}),
    },
    select: {
      id: true,
      items: {
        select: {
          quantity: true,
          costPrice: true,
          catalogItem: { select: { costPrice: true } },
        },
      },
    },
  });

  let totalCOGS = 0;
  for (const sale of sales) {
    for (const item of sale.items) {
      const qty = Number(item.quantity);
      const cost = item.costPrice ? Number(item.costPrice) : (item.catalogItem.costPrice ? Number(item.catalogItem.costPrice) : 0);
      totalCOGS += qty * cost;
    }
  }

  return totalCOGS;
}

// ─── Profit & Loss ────────────────────────────────────────────────────────

export async function getProfitLoss(
  businessId: string,
  startDate: Date,
  endDate: Date,
  branchId?: string,
): Promise<ProfitLossResult> {
  const where = {
    businessId,
    status: "completed",
    saleDate: { gte: startDate, lte: endDate },
    ...(branchId ? { branchId } : {}),
  };

  const [salesAgg, expenseAgg] = await Promise.all([
    prisma.sale.aggregate({
      where,
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        businessId,
        status: { in: ["approved", "paid"] },
        expenseDate: { gte: startDate, lte: endDate },
        ...(branchId ? { branchId } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const revenue = Number(salesAgg._sum.grandTotal ?? 0);
  const saleCount = salesAgg._count;
  const cogs = await calculateCOGS(businessId, startDate, endDate, branchId);
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const operatingExpenses = Number(expenseAgg._sum.amount ?? 0);
  const operatingProfit = grossProfit - operatingExpenses;
  const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
  const netProfit = operatingProfit;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    operatingExpenses,
    operatingProfit,
    operatingMargin,
    netProfit,
    netMargin,
    saleCount,
    expenseCount: expenseAgg._count,
  };
}

// ─── Cash Flow ────────────────────────────────────────────────────────────

export async function getCashFlow(
  businessId: string,
  startDate: Date,
  endDate: Date,
): Promise<CashFlowResult> {
  const [cashSalePayments, paymentsOut, refunds, expenses, cashRegisters, invoicePayments] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        businessId,
        status: "completed",
        paidAt: { gte: startDate, lte: endDate },
        saleId: { not: null },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        businessId,
        status: "completed",
        paidAt: { gte: startDate, lte: endDate },
        purchaseId: { not: null },
      },
      _sum: { amount: true },
    }),
    prisma.sale.aggregate({
      where: {
        businessId,
        status: "refunded",
        saleDate: { gte: startDate, lte: endDate },
      },
      _sum: { grandTotal: true },
    }),
    prisma.expense.aggregate({
      where: {
        businessId,
        status: { in: ["approved", "paid"] },
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.cashRegister.findMany({
      where: { businessId, isActive: true },
      select: { currentBalance: true },
    }),
    prisma.payment.aggregate({
      where: {
        businessId,
        status: "completed",
        paidAt: { gte: startDate, lte: endDate },
        invoiceId: { not: null },
        saleId: null,
      },
      _sum: { amount: true },
    }),
  ]);

  let openingBalance = 0;
  if (cashRegisters.length > 0) {
    openingBalance = Number(cashRegisters.reduce((sum, cr) => sum + Number(cr.currentBalance), 0));
  } else {
    const [priorInflows, priorOutflows, priorExpenses] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          businessId,
          status: "completed",
          paidAt: { lt: startDate },
          OR: [
            { saleId: { not: null } },
            { invoiceId: { not: null } },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: "completed",
          paidAt: { lt: startDate },
          purchaseId: { not: null },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          businessId,
          status: { in: ["approved", "paid"] },
          expenseDate: { lt: startDate },
        },
        _sum: { amount: true },
      }),
    ]);
    openingBalance =
      Number(priorInflows._sum.amount ?? 0) -
      Number(priorOutflows._sum.amount ?? 0) -
      Number(priorExpenses._sum.amount ?? 0);
  }

  const cashSales = Number(cashSalePayments._sum.amount ?? 0);
  const customerCollections = Number(invoicePayments._sum.amount ?? 0);
  const supplierPayments = Number(paymentsOut._sum.amount ?? 0);
  const refundAmount = Number(refunds._sum.grandTotal ?? 0);
  const expenseAmount = Number(expenses._sum.amount ?? 0);
  const totalInflows = cashSales + customerCollections;
  const totalOutflows = supplierPayments + expenseAmount + refundAmount;

  return {
    openingBalance,
    inflows: {
      cashSales,
      customerCollections,
      otherInflows: 0,
      totalInflows,
    },
    outflows: {
      supplierPayments,
      expenses: expenseAmount,
      refunds: refundAmount,
      otherOutflows: 0,
      totalOutflows,
    },
    closingBalance: openingBalance + totalInflows - totalOutflows,
  };
}

// ─── Inventory Valuation ──────────────────────────────────────────────────

export async function getInventoryValuation(
  businessId: string,
): Promise<InventoryValuationItem[]> {
  const balances = await prisma.inventoryBalance.findMany({
    where: {
      location: { businessId, isActive: true },
      quantityOnHand: { gt: 0 },
    },
    include: {
      catalogItem: { select: { name: true, sku: true, costPrice: true, category: { select: { name: true } } } },
      location: { select: { name: true } },
    },
    orderBy: { catalogItem: { name: "asc" } },
  });

  return balances.map((b) => ({
    catalogItemId: b.catalogItemId,
    name: b.catalogItem.name,
    sku: b.catalogItem.sku,
    quantityOnHand: Number(b.quantityOnHand),
    unitCost: b.catalogItem.costPrice ? Number(b.catalogItem.costPrice) : 0,
    totalValue: Number(b.quantityOnHand) * (b.catalogItem.costPrice ? Number(b.catalogItem.costPrice) : 0),
    categoryName: b.catalogItem.category?.name ?? null,
    locationName: b.location.name,
  }));
}

export async function getInventoryValuationSummary(businessId: string): Promise<{
  totalValue: number;
  totalItems: number;
  byCategory: CategoryValuation[];
}> {
  const items = await getInventoryValuation(businessId);
  const totalValue = items.reduce((s, i) => s + i.totalValue, 0);

  const byCategoryMap = new Map<string, { totalValue: number; itemCount: number }>();
  for (const item of items) {
    const cat = item.categoryName || "Uncategorized";
    const existing = byCategoryMap.get(cat) || { totalValue: 0, itemCount: 0 };
    existing.totalValue += item.totalValue;
    existing.itemCount++;
    byCategoryMap.set(cat, existing);
  }

  return {
    totalValue,
    totalItems: items.length,
    byCategory: Array.from(byCategoryMap.entries()).map(([categoryName, v]) => ({ categoryName, ...v })),
  };
}

// ─── Branch Performance ───────────────────────────────────────────────────

export async function getBranchPerformance(
  businessId: string,
  startDate: Date,
  endDate: Date,
): Promise<BranchPerformance[]> {
  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true, _count: { select: { staffAssignments: true } } },
  });

  const results: BranchPerformance[] = [];

  for (const branch of branches) {
    const [salesAgg, expenseAgg, invBalances, receivablesSum, payablesSum] = await Promise.all([
      prisma.sale.aggregate({
        where: { businessId, branchId: branch.id, status: "completed", saleDate: { gte: startDate, lte: endDate } },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { businessId, branchId: branch.id, status: { in: ["approved", "paid"] }, expenseDate: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.inventoryBalance.findMany({
        where: { location: { businessId, branchId: branch.id, isActive: true }, quantityOnHand: { gt: 0 } },
        select: { quantityOnHand: true, catalogItem: { select: { costPrice: true } } },
      }),
      prisma.invoice.aggregate({
        where: { businessId, branchId: branch.id, status: { in: ["unpaid", "partial", "overdue"] } },
        _sum: { balanceDue: true },
      }),
      prisma.purchase.aggregate({
        where: { businessId, branchId: branch.id, balanceDue: { gt: 0 } },
        _sum: { balanceDue: true },
      }),
    ]);

    const revenue = Number(salesAgg._sum.grandTotal ?? 0);
    const cogs = await calculateCOGS(businessId, startDate, endDate, branch.id);
    const grossProfit = revenue - cogs;
    const expenses = Number(expenseAgg._sum.amount ?? 0);
    const operatingProfit = grossProfit - expenses;

    const inventoryValue = invBalances.reduce((sum, b) => {
      const qty = Number(b.quantityOnHand);
      const cost = b.catalogItem.costPrice ? Number(b.catalogItem.costPrice) : 0;
      return sum + (qty * cost);
    }, 0);

    results.push({
      branchId: branch.id,
      branchName: branch.name,
      revenue,
      cogs,
      grossProfit,
      expenses,
      operatingProfit,
      receivables: Number(receivablesSum._sum.balanceDue ?? 0),
      payables: Number(payablesSum._sum.balanceDue ?? 0),
      inventoryValue,
      saleCount: salesAgg._count,
      staffCount: branch._count.staffAssignments,
    });
  }

  return results.sort((a, b) => b.revenue - a.revenue);
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────

export async function getDashboardData(
  businessId: string,
): Promise<DashboardData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    todaySales,
    monthlySales,
    pl,
    receivablesAgg,
    payablesAgg,
    invSummary,
    lowStock,
    topProductsRaw,
    customersAgg,
    supplierAgg,
    cashInflowAgg,
    cashOutflowAgg,
    expensesAgg,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId, status: "completed", saleDate: { gte: startOfDay } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { businessId, status: "completed", saleDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    getProfitLoss(businessId, startOfMonth, endOfMonth),
    prisma.invoice.aggregate({
      where: { businessId, status: { in: ["unpaid", "partial", "overdue"] } },
      _sum: { balanceDue: true },
    }),
    prisma.purchase.aggregate({
      where: { businessId, balanceDue: { gt: 0 } },
      _sum: { balanceDue: true },
    }),
    getInventoryValuationSummary(businessId),
    prisma.inventoryBalance.findMany({
      where: {
        location: { businessId, isActive: true },
        quantityOnHand: { gt: 0 },
      },
      select: { quantityOnHand: true, reorderPoint: true },
    }).then((rows) => rows.filter((r) => Number(r.quantityOnHand) <= Number(r.reorderPoint)).length),
    prisma.saleItem.groupBy({
      by: ["catalogItemId"],
      where: {
        sale: { businessId, status: "completed", saleDate: { gte: startOfMonth } },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 5,
    }),
    prisma.payment.groupBy({
      by: ["customerId"],
      where: {
        businessId,
        status: "completed",
        customerId: { not: null },
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.purchase.groupBy({
      by: ["supplierId"],
      where: { businessId, balanceDue: { gt: 0 } },
      _sum: { balanceDue: true },
      _count: true,
      orderBy: { _sum: { balanceDue: "desc" } },
      take: 5,
    }),
    prisma.payment.aggregate({
      where: { businessId, status: "completed", saleId: { not: null }, paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { businessId, status: "completed", purchaseId: { not: null }, paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId, status: { in: ["approved", "paid"] }, expenseDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  // Resolve top product names
  const productIds = topProductsRaw.map((p) => p.catalogItemId);
  const products = productIds.length > 0
    ? await prisma.catalogItem.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  // Resolve top customer names
  const customerIds = customersAgg.map((c) => c.customerId).filter(Boolean) as string[];
  const customers = customerIds.length > 0
    ? await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, firstName: true, lastName: true } })
    : [];
  const customerMap = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName ?? ""}`.trim()]));

  // Resolve top supplier names
  const supplierIds = supplierAgg.map((s) => s.supplierId);
  const suppliers = supplierIds.length > 0
    ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } })
    : [];
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  const customerPayments = Number(cashInflowAgg._sum.amount ?? 0);
  const supplierPayments = Number(cashOutflowAgg._sum.amount ?? 0);
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);

  return {
    todaySales: Number(todaySales._sum.grandTotal ?? 0),
    todaySalesCount: todaySales._count,
    monthlySales: Number(monthlySales._sum.grandTotal ?? 0),
    monthlySalesCount: monthlySales._count,
    grossProfit: pl.grossProfit,
    netProfit: pl.netProfit,
    receivablesTotal: Number(receivablesAgg._sum.balanceDue ?? 0),
    payablesTotal: Number(payablesAgg._sum.balanceDue ?? 0),
    cashPosition: customerPayments - supplierPayments - totalExpenses,
    inventoryValue: invSummary.totalValue,
    lowStockCount: lowStock,
    topProducts: topProductsRaw.map((p) => ({
      name: productMap.get(p.catalogItemId) ?? "Unknown",
      quantity: Number(p._sum.quantity ?? 0),
      revenue: Number(p._sum.subtotal ?? 0),
    })),
    topCustomers: customersAgg.map((c) => ({
      name: customerMap.get(c.customerId ?? "") ?? "Unknown",
      total: Number(c._sum.amount ?? 0),
      count: c._count,
    })),
    topSuppliers: supplierAgg.map((s) => ({
      name: supplierMap.get(s.supplierId) ?? "Unknown",
      total: Number(s._sum.balanceDue ?? 0),
      count: s._count,
    })),
  };
}
