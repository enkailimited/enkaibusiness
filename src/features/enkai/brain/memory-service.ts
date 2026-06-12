import "server-only";

import { prisma } from "@/server/db";

export interface BusinessMemory {
  topProducts: string[];
  topCustomers: string[];
  topSuppliers: string[];
  preferredPaymentMethods: string[];
  recentExpenseCategories: string[];
  totalSales?: number;
  totalExpenses?: number;
  totalCustomers?: number;
}

const cache = new Map<string, { data: BusinessMemory; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getBusinessMemory(businessId: string): Promise<BusinessMemory> {
  const cached = cache.get(businessId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const [live, learned] = await Promise.all([
    computeLiveMemory(businessId),
    getLearnedMemory(businessId),
  ]);

  const memory: BusinessMemory = {
    topProducts: [...new Set([...live.topProducts, ...learned.topProducts])].slice(0, 10),
    topCustomers: [...new Set([...live.topCustomers, ...learned.topCustomers])].slice(0, 10),
    topSuppliers: [...new Set([...live.topSuppliers, ...learned.topSuppliers])].slice(0, 10),
    preferredPaymentMethods: [...new Set([...live.preferredPaymentMethods, ...learned.preferredPaymentMethods])].slice(0, 10),
    recentExpenseCategories: [...new Set([...live.recentExpenseCategories, ...learned.recentExpenseCategories])].slice(0, 10),
    totalSales: live.totalSales,
    totalExpenses: live.totalExpenses,
    totalCustomers: live.totalCustomers,
  };

  cache.set(businessId, { data: memory, timestamp: Date.now() });
  return memory;
}

async function computeLiveMemory(businessId: string): Promise<BusinessMemory> {
  const [
    topProductSales,
    topCustomerSales,
    recentPurchases,
    recentPayments,
    recentExpenses,
    customerCount,
    salesAgg,
    expenseAgg,
  ] = await Promise.all([
    prisma.saleItem.groupBy({
      by: ["catalogItemId"],
      where: { sale: { businessId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.sale.groupBy({
      by: ["customerId"],
      where: { businessId, customerId: { not: null } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.purchaseOrder.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { supplier: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { method: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { businessId },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 5,
    }),
    prisma.customer.count({ where: { businessId } }),
    prisma.sale.aggregate({ where: { businessId }, _sum: { total: true } }),
    prisma.expense.aggregate({ where: { businessId }, _sum: { amount: true } }),
  ]);

  const productIds = topProductSales.map((p) => p.catalogItemId);
  const products = productIds.length > 0
    ? await prisma.catalogItem.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const customerIds = topCustomerSales.map((s) => s.customerId).filter(Boolean) as string[];
  const customers = customerIds.length > 0
    ? await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, firstName: true, lastName: true } })
    : [];
  const customerMap = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName || ""}`.trim()]));

  const paymentMethods = [...new Set(recentPayments.map((p) => p.method))];

  return {
    topProducts: topProductSales.map((s) => productMap.get(s.catalogItemId) || "Unknown").filter(Boolean) as string[],
    topCustomers: topCustomerSales.map((s) => customerMap.get(s.customerId!) || "Unknown").filter(Boolean) as string[],
    topSuppliers: [...new Set(recentPurchases.map((p) => p.supplier?.name).filter(Boolean))] as string[],
    preferredPaymentMethods: paymentMethods,
    recentExpenseCategories: recentExpenses.map((e) => e.category),
    totalSales: Number(salesAgg._sum.total || 0),
    totalExpenses: Number(expenseAgg._sum.amount || 0),
    totalCustomers: customerCount,
  };
}

// Learned memory (persistent patterns from BusinessMemory table)
async function getLearnedMemory(businessId: string): Promise<BusinessMemory> {
  const records = await prisma.businessMemory.findMany({
    where: { businessId },
    orderBy: { confidence: "desc" },
    take: 30,
  });

  return {
    topProducts: records.filter((r) => r.type === "POPULAR_PRODUCT").map((r) => r.key),
    topCustomers: records.filter((r) => r.type === "TOP_CUSTOMER").map((r) => r.key),
    topSuppliers: records.filter((r) => r.type === "PREFERRED_SUPPLIER").map((r) => r.key),
    preferredPaymentMethods: records.filter((r) => r.type === "PAYMENT_METHOD").map((r) => r.key),
    recentExpenseCategories: records.filter((r) => r.type === "COMMON_EXPENSE").map((r) => r.key),
  };
}

export async function learnPattern(
  businessId: string,
  type: "PREFERRED_SUPPLIER" | "TOP_CUSTOMER" | "COMMON_EXPENSE" | "POPULAR_PRODUCT" | "PAYMENT_METHOD" | "FREQUENT_PRODUCT",
  key: string,
  value: string,
): Promise<void> {
  const existing = await prisma.businessMemory.findUnique({
    where: { businessId_type_key: { businessId, type, key } },
  });

  if (existing) {
    const newConfidence = Math.min(1, existing.confidence + 0.1);
    await prisma.businessMemory.update({
      where: { id: existing.id },
      data: { confidence: newConfidence, value, updatedAt: new Date() },
    });
  } else {
    await prisma.businessMemory.create({
      data: { businessId, type, key, value, confidence: 0.3 },
    });
  }

  cache.delete(businessId);
}

export function invalidateCache(businessId: string): void {
  cache.delete(businessId);
}
