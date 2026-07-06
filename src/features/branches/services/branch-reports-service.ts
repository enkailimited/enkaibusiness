import { prisma } from "@/server/db";
import { resolveBranchScope } from "./branch-scope-service";

type BranchSummary = {
  id: string;
  name: string;
  isHeadOffice: boolean;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  receivables: number;
  payables: number;
  inventoryValue: number;
  profit: number;
};

type ConsolidatedReport = {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalReceivables: number;
  totalPayables: number;
  totalInventoryValue: number;
  grossProfit: number;
  netProfit: number;
  branches: BranchSummary[];
};

export async function getConsolidatedBranchReport(
  businessId: string,
  dateFrom?: Date,
  dateTo?: Date,
): Promise<ConsolidatedReport> {
  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }],
  });

  const dateFilter = dateFrom || dateTo
    ? {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      }
    : undefined;

  const branchSummaries: BranchSummary[] = await Promise.all(
    branches.map(async (branch) => {
      const saleAgg = await prisma.sale.aggregate({
        where: {
          businessId,
          branchId: branch.id,
          status: "completed",
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { grandTotal: true, profitMargin: true },
      });

      const purchaseAgg = await prisma.purchase.aggregate({
        where: {
          businessId,
          branchId: branch.id,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { total: true, balanceDue: true },
      });

      const expenseAgg = await prisma.expense.aggregate({
        where: {
          businessId,
          branchId: branch.id,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
      });

      const invBalances = await prisma.inventoryBalance.findMany({
        where: {
          location: { businessId, branchId: branch.id, isActive: true },
        },
        include: { catalogItem: { select: { costPrice: true, price: true } } },
      });

      const inventoryValue = invBalances.reduce((sum, b) => {
        const cost = b.catalogItem.costPrice ?? b.catalogItem.price;
        return sum + Number(b.quantityOnHand) * Number(cost);
      }, 0);

      const receivablesAgg = await prisma.invoice.aggregate({
        where: {
          businessId,
          branchId: branch.id,
          status: { notIn: ["paid", "cancelled"] },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { balanceDue: true },
      });

      const totalSales = Number(saleAgg._sum.grandTotal ?? 0);
      const totalPurchases = Number(purchaseAgg._sum.total ?? 0);
      const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
      const receivables = Number(receivablesAgg._sum.balanceDue ?? 0);
      const payables = Number(purchaseAgg._sum.balanceDue ?? 0);

      return {
        id: branch.id,
        name: branch.name,
        isHeadOffice: branch.isHeadOffice,
        totalSales,
        totalPurchases,
        totalExpenses,
        receivables,
        payables,
        inventoryValue,
        profit: totalSales - totalPurchases - totalExpenses,
      };
    }),
  );

  const totals = branchSummaries.reduce(
    (acc, b) => ({
      totalSales: acc.totalSales + b.totalSales,
      totalPurchases: acc.totalPurchases + b.totalPurchases,
      totalExpenses: acc.totalExpenses + b.totalExpenses,
      totalReceivables: acc.totalReceivables + b.receivables,
      totalPayables: acc.totalPayables + b.payables,
      totalInventoryValue: acc.totalInventoryValue + b.inventoryValue,
    }),
    {
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalReceivables: 0,
      totalPayables: 0,
      totalInventoryValue: 0,
    },
  );

  return {
    ...totals,
    grossProfit: totals.totalSales - totals.totalPurchases,
    netProfit: totals.totalSales - totals.totalPurchases - totals.totalExpenses,
    branches: branchSummaries,
  };
}

export async function getBranchPayables(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  const { branchIds } = await resolveBranchScope(businessId, branchId, allBranches);

  const purchases = await prisma.purchase.findMany({
    where: {
      businessId,
      branchId: { in: branchIds },
      balanceDue: { gt: 0 },
    },
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });

  const total = purchases.reduce((sum, p) => sum + Number(p.balanceDue), 0);

  return { total, purchases, branchCount: branchIds.length };
}

export async function getBranchReceivables(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  const { branchIds } = await resolveBranchScope(businessId, branchId, allBranches);

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      branchId: { in: branchIds },
      status: { notIn: ["paid", "cancelled"] },
      balanceDue: { gt: 0 },
    },
    include: { customer: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { dueDate: "asc" },
  });

  const total = invoices.reduce((sum, inv) => sum + Number(inv.balanceDue), 0);

  return { total, invoices, branchCount: branchIds.length };
}

export async function getBranchInventorySummary(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  const { branchIds, scope } = await resolveBranchScope(businessId, branchId, allBranches);

  const locations = await prisma.inventoryLocation.findMany({
    where: { businessId, branchId: scope === "all" ? { in: branchIds } : branchIds[0] },
    include: {
      branch: { select: { id: true, name: true } },
      balances: {
        include: { catalogItem: { select: { id: true, name: true, sku: true, price: true, costPrice: true } } },
        orderBy: { catalogItem: { name: "asc" } },
      },
    },
  });

  const totalItems = locations.reduce((sum, loc) => sum + loc.balances.length, 0);
  const totalValue = locations.reduce(
    (sum, loc) =>
      sum + loc.balances.reduce((s, b) => s + Number(b.quantityOnHand) * Number(b.catalogItem.costPrice ?? b.catalogItem.price), 0),
    0,
  );
  const lowStock = locations.reduce(
    (sum, loc) =>
      sum + loc.balances.filter((b) => Number(b.quantityOnHand) > 0 && Number(b.quantityOnHand) <= Number(b.reorderPoint)).length,
    0,
  );
  const outOfStock = locations.reduce(
    (sum, loc) => sum + loc.balances.filter((b) => Number(b.quantityOnHand) <= 0).length,
    0,
  );

  return {
    totalItems,
    totalValue,
    lowStock,
    outOfStock,
    locations: locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      branchName: loc.branch?.name ?? "Shared",
      itemCount: loc.balances.length,
      totalValue: loc.balances.reduce(
        (s, b) => s + Number(b.quantityOnHand) * Number(b.catalogItem.costPrice ?? b.catalogItem.price),
        0,
      ),
    })),
  };
}
