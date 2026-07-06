"use server";

import { getBranchingMode } from "@/features/branches/services/branch-scope-service";
import {
  getConsolidatedBranchReport,
  getBranchPayables,
  getBranchReceivables,
  getBranchInventorySummary,
} from "@/features/branches/services/branch-reports-service";

export async function getBranchingModeAction(businessId: string) {
  return getBranchingMode(businessId);
}

export async function getConsolidatedBranchReportAction(
  businessId: string,
  dateFrom?: string,
  dateTo?: string,
) {
  return getConsolidatedBranchReport(
    businessId,
    dateFrom ? new Date(dateFrom) : undefined,
    dateTo ? new Date(dateTo) : undefined,
  );
}

export async function getBranchPayablesAction(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  return getBranchPayables(businessId, branchId, allBranches);
}

export async function getBranchReceivablesAction(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  return getBranchReceivables(businessId, branchId, allBranches);
}

export async function getBranchInventorySummaryAction(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  return getBranchInventorySummary(businessId, branchId, allBranches);
}
