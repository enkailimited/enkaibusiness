"use server";

import { requireAuth } from "@/server/auth";
import { getDashboardData, getProfitLoss, getCashFlow, getInventoryValuation, getInventoryValuationSummary, getBranchPerformance } from "../services/financial-service";

export async function getDashboardDataAction(businessId: string) {
  await requireAuth();
  return getDashboardData(businessId);
}

export async function getProfitLossAction(
  businessId: string,
  startDate: string,
  endDate: string,
  branchId?: string,
) {
  await requireAuth();
  return getProfitLoss(businessId, new Date(startDate), new Date(endDate), branchId);
}

export async function getCashFlowAction(
  businessId: string,
  startDate: string,
  endDate: string,
) {
  await requireAuth();
  return getCashFlow(businessId, new Date(startDate), new Date(endDate));
}

export async function getInventoryValuationAction(businessId: string) {
  await requireAuth();
  return getInventoryValuation(businessId);
}

export async function getInventoryValuationSummaryAction(businessId: string) {
  await requireAuth();
  return getInventoryValuationSummary(businessId);
}

export async function getBranchPerformanceAction(
  businessId: string,
  startDate: string,
  endDate: string,
) {
  await requireAuth();
  return getBranchPerformance(businessId, new Date(startDate), new Date(endDate));
}
