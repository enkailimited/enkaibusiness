import "server-only";

import { prisma } from "@/server/db";

export async function getCampaignMetrics() {
  const totalLeads = await prisma.lead.count();
  const totalConversions = await prisma.lead.count({
    where: { status: "CONVERTED" },
  });

  return {
    totalLeads,
    totalConversions,
    conversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
  };
}

export async function getLeadSources() {
  const sources = await prisma.lead.groupBy({
    by: ["source"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return sources.map((s) => ({
    source: s.source,
    count: s._count.id,
  }));
}

export async function getConversionTrend(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const conversions = await prisma.lead.findMany({
    where: {
      status: "CONVERTED",
      convertedAt: { gte: startDate },
    },
    select: { convertedAt: true },
    orderBy: { convertedAt: "asc" },
  });

  const trend: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().substring(0, 10);
    trend[key] = 0;
  }

  for (const c of conversions) {
    if (c.convertedAt) {
      const key = c.convertedAt.toISOString().substring(0, 10);
      trend[key] = (trend[key] || 0) + 1;
    }
  }

  return Object.entries(trend).map(([date, count]) => ({
    date,
    conversions: count,
  }));
}
