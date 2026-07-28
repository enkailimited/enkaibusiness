import "server-only";
import { prisma } from "@/server/db";
import { getProductionChartData, getProductionStats } from "./production-service";
import { getFuelStats } from "./fuel-service";

export async function getProductionReport(businessId: string, startDate: Date, endDate: Date) {
  const logs = await prisma.miningProductionLog.findMany({
    where: { businessId, productionDate: { gte: startDate, lte: endDate } },
    orderBy: { productionDate: "asc" },
    include: { site: { select: { id: true, name: true } } },
  });

  const totalQuantity = logs.reduce((sum, l) => sum + Number(l.quantity), 0);
  const bySite = new Map<string, { name: string; quantity: number }>();
  for (const log of logs) {
    const key = log.site?.name || "Unknown";
    const current = bySite.get(key) || { name: key, quantity: 0 };
    current.quantity += Number(log.quantity);
    bySite.set(key, current);
  }

  return {
    totalQuantity,
    totalLogs: logs.length,
    bySite: Array.from(bySite.values()).sort((a, b) => b.quantity - a.quantity),
    daily: logs.map((l) => ({
      date: l.productionDate,
      quantity: Number(l.quantity),
      unit: l.unit,
      grade: l.grade ? Number(l.grade) : null,
      site: l.site?.name || null,
    })),
  };
}

export async function getFuelReport(businessId: string, startDate: Date, endDate: Date) {
  const transactions = await prisma.fuelTransaction.findMany({
    where: { businessId, transactionDate: { gte: startDate, lte: endDate } },
    orderBy: { transactionDate: "asc" },
    include: { equipment: { select: { id: true, name: true } } },
  });

  const totalLiters = transactions.reduce((sum, t) => sum + Number(t.quantity), 0);
  const totalCost = transactions.reduce((sum, t) => sum + Number(t.totalCost || 0), 0);
  const byType = new Map<string, { liters: number; cost: number }>();
  for (const t of transactions) {
    const current = byType.get(t.fuelType) || { liters: 0, cost: 0 };
    current.liters += Number(t.quantity);
    current.cost += Number(t.totalCost || 0);
    byType.set(t.fuelType, current);
  }

  return {
    totalLiters,
    totalCost,
    avgUnitCost: totalLiters > 0 ? totalCost / totalLiters : 0,
    byType: Array.from(byType.entries()).map(([fuelType, data]) => ({ fuelType, ...data })),
    transactions,
  };
}

export async function getEquipmentReport(businessId: string) {
  const [equipment, serviceLogs] = await Promise.all([
    prisma.miningEquipment.findMany({
      where: { businessId, isActive: true },
      include: {
        site: { select: { id: true, name: true } },
        _count: { select: { serviceLogs: true, fuelTxns: true } },
      },
    }),
    prisma.miningServiceLog.findMany({
      where: { businessId },
      orderBy: { serviceDate: "desc" },
      include: { equipment: { select: { id: true, name: true } } },
      take: 50,
    }),
  ]);

  const totalServiceCost = serviceLogs.reduce((sum, s) => sum + Number(s.cost || 0), 0);

  return {
    totalEquipment: equipment.length,
    operational: equipment.filter((e) => e.status === "OPERATIONAL").length,
    maintenance: equipment.filter((e) => e.status === "MAINTENANCE").length,
    repair: equipment.filter((e) => e.status === "REPAIR").length,
    totalServiceCost,
    serviceLogs,
    equipment,
  };
}

export async function getInventoryReport(businessId: string) {
  const items = await prisma.catalogItem.findMany({
    where: { businessId, isActive: true, itemType: { in: ["MINERAL", "ORE", "EQUIPMENT"] as any } },
    include: { balances: { take: 1, orderBy: { updatedAt: "desc" } } },
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    stockOnHand: Number(item.balances[0]?.quantityOnHand || 0),
    reorderPoint: Number(item.balances[0]?.reorderPoint || 0),
  }));
}

export async function getExpenseReport(businessId: string, startDate: Date, endDate: Date) {
  const expenses = await prisma.expense.findMany({
    where: { businessId, expenseDate: { gte: startDate, lte: endDate } },
    orderBy: { expenseDate: "desc" },
    include: { category: { select: { id: true, name: true } } },
  });

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = new Map<string, { name: string; amount: number; count: number }>();
  for (const e of expenses) {
    const key = e.category?.name || "Uncategorized";
    const current = byCategory.get(key) || { name: key, amount: 0, count: 0 };
    current.amount += Number(e.amount);
    current.count++;
    byCategory.set(key, current);
  }

  return {
    totalAmount,
    totalExpenses: expenses.length,
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount),
    expenses,
  };
}

export async function getSalesReport(businessId: string, startDate: Date, endDate: Date) {
  const sales = await prisma.sale.findMany({
    where: { businessId, saleDate: { gte: startDate, lte: endDate } },
    orderBy: { saleDate: "desc" },
    include: {
      items: { include: { catalogItem: { select: { id: true, name: true, itemType: true } } } },
      customer: { select: { id: true, name: true } },
    },
  });

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
  const totalSales = sales.length;

  return { totalRevenue, totalSales, sales };
}
