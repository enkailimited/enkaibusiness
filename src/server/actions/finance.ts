"use server";

import { requireAuth } from "@/server/auth";
import { serialize } from "@/lib/utils";
import {
  getRevenueMetrics,
  getCommissionExpenses,
  getRevenueByPeriod,
  getFinancialSummary,
} from "@/server/services/finance-service";

export async function getRevenueMetricsAction() {
  await requireAuth();
  const data = await getRevenueMetrics();
  return serialize(data);
}

export async function getCommissionExpensesAction() {
  await requireAuth();
  const data = await getCommissionExpenses();
  return serialize(data);
}

export async function getRevenueByPeriodAction(
  startDate: string,
  endDate?: string,
) {
  await requireAuth();
  const data = await getRevenueByPeriod(
    new Date(startDate),
    endDate ? new Date(endDate) : undefined,
  );
  return serialize(data);
}

export async function getFinancialSummaryAction() {
  await requireAuth();
  const data = await getFinancialSummary();
  return serialize(data);
}
