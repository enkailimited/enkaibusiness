import "server-only";
import { prisma } from "@/server/db";
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { enqueue } from "@/server/jobs/queue";
import { computeAndStoreSnapshot } from "@/server/enterprise/sales-targets/services/kpi-snapshot-service";
import { updateAchieved } from "@/server/enterprise/sales-targets/services/target-service";

function getPeriodStart(period: string, date: Date): Date {
  const d = new Date(date);
  switch (period) {
    case "DAILY":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case "WEEKLY": {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    case "MONTHLY":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "QUARTERLY": {
      const q = Math.floor(d.getMonth() / 3) * 3;
      return new Date(d.getFullYear(), q, 1);
    }
    case "YEARLY":
      return new Date(d.getFullYear(), 0, 1);
    default:
      return d;
  }
}

function getPeriodEnd(period: string, date: Date): Date {
  const start = getPeriodStart(period, date);
  const end = new Date(start);
  switch (period) {
    case "DAILY":
      end.setDate(end.getDate() + 1);
      break;
    case "WEEKLY":
      end.setDate(end.getDate() + 7);
      break;
    case "MONTHLY":
      end.setMonth(end.getMonth() + 1);
      break;
    case "QUARTERLY":
      end.setMonth(end.getMonth() + 3);
      break;
    case "YEARLY":
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  end.setMilliseconds(-1);
  return end;
}

async function computeKPIs(period: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"): Promise<void> {
  const now = new Date();
  const dateFrom = getPeriodStart(period, now);
  const dateTo = getPeriodEnd(period, now);

  try {
    await computeAndStoreSnapshot(period, dateFrom, dateTo);
  } catch (error) {
    console.error(`computeKPIs(${period}) error:`, error);
  }
}

async function computeDailyKPIs(): Promise<void> {
  await computeKPIs("DAILY");
}

async function computeWeeklyKPIs(): Promise<void> {
  await computeKPIs("WEEKLY");
}

async function computeMonthlyKPIs(): Promise<void> {
  await computeKPIs("MONTHLY");
}

async function computeQuarterlyKPIs(): Promise<void> {
  await computeKPIs("QUARTERLY");
}

async function computeYearlyKPIs(): Promise<void> {
  await computeKPIs("YEARLY");
}

async function computeSalesRepMetrics(): Promise<void> {
  const profiles = await prisma.salesProfile.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  for (const profile of profiles) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [leadsThisMonth, conversionsThisMonth, commissionThisMonth] = await Promise.all([
      prisma.lead.count({ where: { assignedToId: profile.id, createdAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { assignedToId: profile.id, status: "CONVERTED", convertedAt: { gte: startOfMonth } } }),
      prisma.commissionLedger.aggregate({
        _sum: { amount: true },
        where: { salesProfileId: profile.id, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      }),
    ]);

    await updateAchieved(profile.id, "leads", leadsThisMonth);
    await updateAchieved(profile.id, "conversions", conversionsThisMonth);
    await updateAchieved(profile.id, "revenue", Number(commissionThisMonth._sum.amount ?? 0));
  }
}

export function registerReportingAutomation(): void {
  firdausEventBus.on("BusinessCreated", async () => {
    try {
      await computeDailyKPIs();
      await enqueue("refresh-analytics", "kpi-update", { type: "sales-kpi" }, { priority: 1 });
    } catch {}
  });

  firdausEventBus.on("SubscriptionRenewed", async () => {
    try {
      await computeDailyKPIs();
      await computeSalesRepMetrics();
      await enqueue("refresh-analytics", "kpi-update", { type: "sales-kpi" }, { priority: 1 });
    } catch {}
  });

  firdausEventBus.on("InstallationCompleted", async () => {
    try {
      await computeDailyKPIs();
      await computeSalesRepMetrics();
      await enqueue("refresh-analytics", "kpi-update", { type: "sales-kpi" }, { priority: 1 });
    } catch {}
  });

  firdausEventBus.on("LeadConverted", async () => {
    try {
      await computeSalesRepMetrics();
    } catch {}
  });

  firdausEventBus.on("CommissionEarned", async () => {
    try {
      await computeSalesRepMetrics();
    } catch {}
  });

  setInterval(async () => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const day = now.getDay();
      const date = now.getDate();

      if (hours === 0) {
        await computeDailyKPIs();
      }

      if (hours === 0 && day === 1) {
        await computeWeeklyKPIs();
      }

      if (hours === 0 && date === 1) {
        await computeMonthlyKPIs();
      }

      if (hours === 0 && date === 1 && [1, 4, 7, 10].includes(now.getMonth() + 1)) {
        await computeQuarterlyKPIs();
      }

      if (hours === 0 && date === 1 && now.getMonth() === 0) {
        await computeYearlyKPIs();
      }

      await computeSalesRepMetrics();
    } catch {}
  }, 60 * 60 * 1000);

  computeDailyKPIs().catch(() => {});
  computeSalesRepMetrics().catch(() => {});
}

export { computeDailyKPIs, computeWeeklyKPIs, computeMonthlyKPIs, computeQuarterlyKPIs, computeYearlyKPIs, computeSalesRepMetrics };
