"use server";
import { requireAuth } from "@/server/auth";
import { serialize } from "@/lib/utils";
import type { KpiPeriod } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";

import { getPlatformDashboardData } from "../services/platform-dashboard-service";
import { getSalesDashboardData } from "../services/sales-dashboard-service";
import { getInstallerDashboardData } from "../services/installer-dashboard-service";
import {
  getRevenueReport,
  getCommissionReport,
  getInstallationReport,
  getCLVReport,
  getChurnReport,
  getRetentionReport,
  getReferralReport,
  getSalesPerformanceReport,
} from "../services/admin-reports-service";
import {
  salesDashboardSchema,
  installerDashboardSchema,
  revenueReportSchema,
  commissionReportSchema,
  installationReportSchema,
  clvReportSchema,
  churnReportSchema,
  retentionReportSchema,
  referralReportSchema,
  salesPerformanceReportSchema,
} from "../schemas";

export async function getPlatformDashboardAction(): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  try {
    const data = await getPlatformDashboardData();
    return { success: true, message: "Platform dashboard loaded", data: serialize(data) };
  } catch (error) {
    console.error("Platform dashboard error:", error);
    return { success: false, message: "Failed to load platform dashboard" };
  }
}

export async function getSalesDashboardAction(
  salesProfileId: string,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = salesDashboardSchema.safeParse({ salesProfileId });
  if (!parsed.success) {
    return { success: false, message: "Invalid sales profile ID" };
  }
  try {
    const data = await getSalesDashboardData(salesProfileId);
    return { success: true, message: "Sales dashboard loaded", data: serialize(data) };
  } catch (error) {
    console.error("Sales dashboard error:", error);
    return { success: false, message: "Failed to load sales dashboard" };
  }
}

export async function getInstallerDashboardAction(
  installerId: string,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = installerDashboardSchema.safeParse({ installerId });
  if (!parsed.success) {
    return { success: false, message: "Invalid installer ID" };
  }
  try {
    const data = await getInstallerDashboardData(installerId);
    return { success: true, message: "Installer dashboard loaded", data: serialize(data) };
  } catch (error) {
    console.error("Installer dashboard error:", error);
    return { success: false, message: "Failed to load installer dashboard" };
  }
}

export async function getRevenueReportAction(
  period: KpiPeriod = "MONTHLY",
  dateFrom?: string,
  dateTo?: string,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = revenueReportSchema.safeParse({ period, dateFrom, dateTo });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getRevenueReport(period, dateFrom, dateTo);
    return { success: true, message: "Revenue report loaded", data: serialize(data) };
  } catch (error) {
    console.error("Revenue report error:", error);
    return { success: false, message: "Failed to load revenue report" };
  }
}

export async function getCommissionReportAction(
  period: KpiPeriod = "MONTHLY",
  salesProfileId?: string,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = commissionReportSchema.safeParse({ period, salesProfileId });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getCommissionReport(period, salesProfileId);
    return { success: true, message: "Commission report loaded", data: serialize(data) };
  } catch (error) {
    console.error("Commission report error:", error);
    return { success: false, message: "Failed to load commission report" };
  }
}

export async function getInstallationReportAction(
  period: KpiPeriod = "MONTHLY",
  installerId?: string,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = installationReportSchema.safeParse({ period, installerId });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getInstallationReport(period, installerId);
    return { success: true, message: "Installation report loaded", data: serialize(data) };
  } catch (error) {
    console.error("Installation report error:", error);
    return { success: false, message: "Failed to load installation report" };
  }
}

export async function getCLVReportAction(
  limit: number = 10,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = clvReportSchema.safeParse({ limit });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getCLVReport(limit);
    return { success: true, message: "CLV report loaded", data: serialize(data) };
  } catch (error) {
    console.error("CLV report error:", error);
    return { success: false, message: "Failed to load CLV report" };
  }
}

export async function getChurnReportAction(
  period: KpiPeriod = "MONTHLY",
  dateFrom?: string,
  dateTo?: string,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = churnReportSchema.safeParse({ period, dateFrom, dateTo });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getChurnReport(period, dateFrom, dateTo);
    return { success: true, message: "Churn report loaded", data: serialize(data) };
  } catch (error) {
    console.error("Churn report error:", error);
    return { success: false, message: "Failed to load churn report" };
  }
}

export async function getRetentionReportAction(
  period: KpiPeriod = "MONTHLY",
  dateFrom?: string,
  dateTo?: string,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = retentionReportSchema.safeParse({ period, dateFrom, dateTo });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getRetentionReport(period, dateFrom, dateTo);
    return { success: true, message: "Retention report loaded", data: serialize(data) };
  } catch (error) {
    console.error("Retention report error:", error);
    return { success: false, message: "Failed to load retention report" };
  }
}

export async function getReferralReportAction(
  period: KpiPeriod = "MONTHLY",
  limit: number = 10,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = referralReportSchema.safeParse({ period, limit });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getReferralReport(period, limit);
    return { success: true, message: "Referral report loaded", data: serialize(data) };
  } catch (error) {
    console.error("Referral report error:", error);
    return { success: false, message: "Failed to load referral report" };
  }
}

export async function getSalesPerformanceReportAction(
  period: KpiPeriod = "MONTHLY",
  limit: number = 20,
): Promise<ActionResponse & { data?: unknown }> {
  await requireAuth();
  const parsed = salesPerformanceReportSchema.safeParse({ period, limit });
  if (!parsed.success) {
    return { success: false, message: "Invalid report parameters" };
  }
  try {
    const data = await getSalesPerformanceReport(period, limit);
    return { success: true, message: "Sales performance report loaded", data: serialize(data) };
  } catch (error) {
    console.error("Sales performance report error:", error);
    return { success: false, message: "Failed to load sales performance report" };
  }
}
