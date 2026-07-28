"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  miningSiteSchema, miningSiteFilterSchema,
  miningLicenseSchema,
  miningEquipmentSchema,
  fuelTransactionSchema,
  miningProductionLogSchema,
  miningServiceLogSchema,
} from "../schemas";
import {
  createMiningSite, updateMiningSite, deleteMiningSite,
  listMiningSites, getMiningSite, getMiningSiteStats,
} from "../services/site-service";
import {
  createMiningLicense, updateMiningLicense, deleteMiningLicense,
  listMiningLicenses, getMiningLicense, getLicenseStats, getExpiringLicenses,
} from "../services/license-service";
import {
  createMiningEquipment, updateMiningEquipment, deleteMiningEquipment,
  listMiningEquipment, getMiningEquipment, getEquipmentStats,
  createServiceLog, getDueForService,
} from "../services/equipment-service";
import {
  createFuelTransaction, deleteFuelTransaction,
  listFuelTransactions, getFuelTransaction, getFuelStats,
} from "../services/fuel-service";
import {
  createProductionLog, deleteProductionLog,
  listProductionLogs, getProductionStats, getProductionChartData,
} from "../services/production-service";
import { getMiningDashboard } from "../services/dashboard-service";
import {
  getProductionReport, getFuelReport, getEquipmentReport,
  getInventoryReport, getExpenseReport, getSalesReport,
} from "../services/report-service";
import type { ActionResponse } from "@/types/relationships";

async function checkPermission(userId: string, permission: string, businessId: string): Promise<boolean> {
  return hasPermission(userId, permission, businessId);
}

// ─── Sites ───────────────────────────────────────────────────────────────────

export async function listMiningSitesAction(businessId: string, filters?: Record<string, string>) {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.sites.view", businessId);
  if (!can) return [];
  return listMiningSites(businessId, filters);
}

export async function getMiningSiteAction(id: string, businessId: string) {
  const user = await requireAuth();
  return getMiningSite(id, businessId);
}

export async function createMiningSiteAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.sites.create", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningSiteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await createMiningSite(parsed.data, businessId, user.id);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/sites`);
  return { success: true, message: "Site created successfully" };
}

export async function updateMiningSiteAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.sites.update", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningSiteSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await updateMiningSite(id, parsed.data, businessId);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/sites`);
  return { success: true, message: "Site updated successfully" };
}

export async function deleteMiningSiteAction(id: string, businessId: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.sites.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission" };
  await deleteMiningSite(id, businessId);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/sites`);
  return { success: true };
}

// ─── Licenses ─────────────────────────────────────────────────────────────────

export async function listMiningLicensesAction(businessId: string, filters?: Record<string, string>) {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.licenses.view", businessId);
  if (!can) return [];
  return listMiningLicenses(businessId, filters);
}

export async function getMiningLicenseAction(id: string, businessId: string) {
  const user = await requireAuth();
  return getMiningLicense(id, businessId);
}

export async function createMiningLicenseAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.licenses.create", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningLicenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await createMiningLicense(parsed.data, businessId, user.id);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/licenses`);
  return { success: true, message: "License created successfully" };
}

export async function updateMiningLicenseAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.licenses.update", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningLicenseSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await updateMiningLicense(id, parsed.data, businessId);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/licenses`);
  return { success: true, message: "License updated successfully" };
}

export async function deleteMiningLicenseAction(id: string, businessId: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.licenses.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission" };
  await deleteMiningLicense(id, businessId);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/licenses`);
  return { success: true };
}

// ─── Equipment ────────────────────────────────────────────────────────────────

export async function listMiningEquipmentAction(businessId: string, filters?: Record<string, string>) {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.equipment.view", businessId);
  if (!can) return [];
  return listMiningEquipment(businessId, filters);
}

export async function getMiningEquipmentAction(id: string, businessId: string) {
  const user = await requireAuth();
  return getMiningEquipment(id, businessId);
}

export async function createMiningEquipmentAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.equipment.create", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningEquipmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await createMiningEquipment(parsed.data, businessId, user.id);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/equipment`);
  return { success: true, message: "Equipment created successfully" };
}

export async function updateMiningEquipmentAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.equipment.update", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningEquipmentSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await updateMiningEquipment(id, parsed.data, businessId);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/equipment`);
  return { success: true, message: "Equipment updated successfully" };
}

export async function deleteMiningEquipmentAction(id: string, businessId: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.equipment.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission" };
  await deleteMiningEquipment(id, businessId);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/equipment`);
  return { success: true };
}

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export async function listFuelTransactionsAction(businessId: string, filters?: Record<string, string>) {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.fuel.view", businessId);
  if (!can) return [];
  return listFuelTransactions(businessId, filters);
}

export async function createFuelTransactionAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.fuel.create", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = fuelTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await createFuelTransaction(parsed.data, businessId, user.id);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/fuel`);
  return { success: true, message: "Fuel transaction recorded" };
}

export async function deleteFuelTransactionAction(id: string, businessId: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.fuel.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission" };
  await deleteFuelTransaction(id, businessId);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/fuel`);
  return { success: true };
}

// ─── Production ───────────────────────────────────────────────────────────────

export async function listProductionLogsAction(businessId: string, filters?: Record<string, string>) {
  const user = await requireAuth();
  return listProductionLogs(businessId, filters);
}

export async function createProductionLogAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.production.create", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningProductionLogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await createProductionLog(parsed.data, businessId, user.id);
  revalidatePath(`/workspaces/businesses/${businessId}/mining`);
  return { success: true, message: "Production logged" };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getMiningDashboardAction(businessId: string) {
  const user = await requireAuth();
  return getMiningDashboard(businessId);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getMiningStatsAction(businessId: string) {
  const user = await requireAuth();
  const [sites, licenses, equipment, production, fuel] = await Promise.all([
    getMiningSiteStats(businessId),
    getLicenseStats(businessId),
    getEquipmentStats(businessId),
    getProductionStats(businessId),
    getFuelStats(businessId),
  ]);
  return { sites, licenses, equipment, production, fuel };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getMiningReportAction(
  businessId: string,
  reportType: string,
  startDate: string,
  endDate: string,
) {
  const user = await requireAuth();
  const start = new Date(startDate);
  const end = new Date(endDate);

  switch (reportType) {
    case "production": return getProductionReport(businessId, start, end);
    case "fuel": return getFuelReport(businessId, start, end);
    case "equipment": return getEquipmentReport(businessId);
    case "inventory": return getInventoryReport(businessId);
    case "expenses": return getExpenseReport(businessId, start, end);
    case "sales": return getSalesReport(businessId, start, end);
    default: return null;
  }
}

// ─── Service Logs ─────────────────────────────────────────────────────────────

export async function createServiceLogAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await checkPermission(user.id, "mining.equipment.maintain", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = miningServiceLogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await createServiceLog(parsed.data, businessId, user.id);
  revalidatePath(`/workspaces/businesses/${businessId}/mining/equipment`);
  return { success: true, message: "Service log recorded" };
}
