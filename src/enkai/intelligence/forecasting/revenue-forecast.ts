import "server-only";

import { prisma } from "@/server/db";

export interface RevenueForecast {
  businessId: string;
  currentMonth: number;
  nextMonth: number;
  nextQuarter: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  dataPoints: Array<{ month: string; revenue: number; forecast?: boolean }>;
}

export async function forecastRevenue(
  businessId: string,
  months: number = 6,
): Promise<RevenueForecast> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { grandTotal: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const mappedSales = sales.map((s) => ({ total: Number(s.grandTotal), createdAt: s.createdAt }));

  const monthlyData = aggregateByMonth(mappedSales, months);
  const historical = monthlyData.filter((d) => !d.forecast);
  const histRevenue = historical.map((d) => d.revenue);
  const avgRevenue = histRevenue.length > 0
    ? histRevenue.reduce((sum, d) => sum + d, 0) / histRevenue.length
    : 0;

  const trend = calculateTrend(histRevenue);
  const growthRate = trend === "up" ? 1.05 : trend === "down" ? 0.95 : 1.0;

  const forecastedData = monthlyData.filter((d) => d.forecast);
  const firstForecast = forecastedData[0];
  const nextMonth = firstForecast ? firstForecast.revenue : avgRevenue * growthRate;
  const nextQuarter = forecastedData
    .slice(0, 3)
    .reduce((sum, d) => sum + d.revenue, avgRevenue * 3 * growthRate);

  const lastHistorical = historical[historical.length - 1];
  const currentMonthVal = lastHistorical ? lastHistorical.revenue : 0;

  return {
    businessId,
    currentMonth: currentMonthVal,
    nextMonth,
    nextQuarter,
    confidence: mappedSales.length >= 6 ? 0.8 : mappedSales.length >= 3 ? 0.6 : 0.3,
    trend,
    dataPoints: monthlyData.slice(-months),
  };
}

function aggregateByMonth(
  sales: Array<{ total: number; createdAt: Date }>,
  months: number,
): Array<{ month: string; revenue: number; forecast?: boolean }> {
  const monthly: Record<string, number> = {};
  const now = new Date();

  for (let i = months; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = 0;
  }

  for (const sale of sales) {
    const d = sale.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthly) {
      monthly[key] = (monthly[key] || 0) + sale.total;
    }
  }

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const historicalMonths = Object.keys(monthly).filter((k) => k <= currentKey);
  const forecastMonths = Object.keys(monthly).filter((k) => k > currentKey);

  const historical = historicalMonths.map((month) => ({ month, revenue: monthly[month] || 0 }));
  const histRevenue = historical.map((d) => d.revenue);
  const avgRevenue = histRevenue.length > 0
    ? histRevenue.reduce((s, d) => s + d, 0) / histRevenue.length
    : 0;

  const trend = calculateTrend(histRevenue);
  const growthRate = trend === "up" ? 1.05 : trend === "down" ? 0.95 : 1.0;

  const forecast = forecastMonths.map((month, i) => ({
    month,
    revenue: avgRevenue * Math.pow(growthRate, i + 1),
    forecast: true as const,
  }));

  return [...historical, ...forecast];
}

function calculateTrend(values: number[]): "up" | "down" | "stable" {
  if (values.length < 2) return "stable";
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const change = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  if (change > 0.1) return "up";
  if (change < -0.1) return "down";
  return "stable";
}
