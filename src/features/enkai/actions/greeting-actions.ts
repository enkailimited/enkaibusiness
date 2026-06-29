"use server";

import { z } from "zod";
import { getLoginGreetingData, scanBusiness } from "../services/proactive-advisor";
import { revenueEngine } from "@/modules/ai/revenue/revenue-engine";
import { reorderEngine } from "@/modules/ai/inventory/reorder-engine";
import { debtCollectionEngine } from "@/modules/ai/credit/debt-collection-engine";
import { healthScoreService } from "@/modules/ai/health/health-score";

const bizId = z.string().uuid("Invalid business ID");
const uid = z.string().uuid("Invalid user ID");

export async function getGreetingDataAction(businessId: string, userId: string) {
  const bParsed = bizId.safeParse(businessId);
  const uParsed = uid.safeParse(userId);
  if (!bParsed.success || !uParsed.success) {
    throw new Error("Invalid business or user ID");
  }
  const [base, revenue, reorder, debts, health] = await Promise.all([
    getLoginGreetingData(businessId, userId),
    revenueEngine.getDailySummary(businessId),
    reorderEngine.getReorderRecommendations(businessId),
    debtCollectionEngine.getCollectionSummary(businessId),
    healthScoreService.calculate(businessId),
  ]);

  return {
    userName: base.userName,
    businessName: base.businessName,
    snapshot: {
      ...base.snapshot,
      todaySales: revenue.total,
      yesterdayChange: revenue.comparison?.percent || 0,
      reorderCount: reorder.filter((r) => r.priority === "immediate" || r.priority === "today").length,
      totalReorderCount: reorder.length,
      overdueCount: debts.countOverdue,
      totalOverdue: debts.totalOverdue,
      healthScore: health.overall,
      healthGrade: health.grade,
    },
    revenue,
    health,
  };
}

export async function getBusinessScanAction(businessId: string) {
  const bParsed = bizId.safeParse(businessId);
  if (!bParsed.success) throw new Error("Invalid business ID");
  const [scan, revenue, health, debts, reorder] = await Promise.all([
    scanBusiness(businessId),
    revenueEngine.generateInsights(businessId),
    healthScoreService.calculate(businessId),
    debtCollectionEngine.getCollectionSummary(businessId),
    reorderEngine.getReorderRecommendations(businessId),
  ]);

  return {
    notifications: scan.notifications,
    insights: revenue,
    health,
    debts,
    reorder: reorder.slice(0, 5),
  };
}
