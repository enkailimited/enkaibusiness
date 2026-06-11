"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createRule, getRules, getRule, updateRule, deleteRule } from "../services/rule-service";
import { createEntry, getEntries, getEntriesByProfile, approveEntry, getPendingPayouts, getCommissionMetrics } from "../services/ledger-service";
import { createPayout, getPayouts, getPayout } from "../services/payout-service";
import {
  createCommissionRuleSchema,
  updateCommissionRuleSchema,
  createPayoutSchema,
  commissionFilterSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import type { CommissionFilters } from "../types";

export async function getCommissionRulesAction() {
  await requireAuth();
  return getRules();
}

export async function getCommissionRuleAction(id: string) {
  await requireAuth();
  return getRule(id);
}

export async function createCommissionRuleAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createCommissionRuleSchema.safeParse({
    name: formData.get("name"),
    hierarchyLevelId: formData.get("hierarchyLevelId") || undefined,
    type: formData.get("type"),
    value: Number(formData.get("value")) || 0,
    minAmount: formData.get("minAmount") ? Number(formData.get("minAmount")) : undefined,
    maxAmount: formData.get("maxAmount") ? Number(formData.get("maxAmount")) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createRule(parsed.data);

  if (result.success) {
    revalidatePath("/commissions");
  }

  return result;
}

export async function updateCommissionRuleAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateCommissionRuleSchema.safeParse({
    name: formData.get("name") || undefined,
    hierarchyLevelId: formData.get("hierarchyLevelId") || undefined,
    type: formData.get("type") || undefined,
    value: formData.get("value") ? Number(formData.get("value")) : undefined,
    minAmount: formData.get("minAmount") ? Number(formData.get("minAmount")) : undefined,
    maxAmount: formData.get("maxAmount") ? Number(formData.get("maxAmount")) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateRule(id, parsed.data);

  if (result.success) {
    revalidatePath("/commissions");
  }

  return result;
}

export async function deleteCommissionRuleAction(id: string) {
  await requireAuth();
  const result = await deleteRule(id);

  if (result.success) {
    revalidatePath("/commissions");
  }

  return result;
}

export async function getCommissionEntriesAction(filters?: CommissionFilters) {
  await requireAuth();
  return getEntries(filters);
}

export async function getEntriesByProfileAction(salesProfileId: string, status?: string) {
  await requireAuth();
  return getEntriesByProfile(salesProfileId, status);
}

export async function approveCommissionEntryAction(ledgerId: string) {
  await requireAuth();
  const result = await approveEntry(ledgerId);

  if (result.success) {
    revalidatePath("/commissions");
  }

  return result;
}

export async function createPayoutAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createPayoutSchema.safeParse({
    entries: JSON.parse((formData.get("entries") as string) || "[]"),
    amount: Number(formData.get("amount")) || 0,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createPayout(parsed.data, user.id);

  if (result.success) {
    revalidatePath("/commissions");
  }

  return result;
}

export async function getPayoutsAction() {
  await requireAuth();
  return getPayouts();
}

export async function getPayoutAction(id: string) {
  await requireAuth();
  return getPayout(id);
}

export async function getPendingPayoutsAction() {
  await requireAuth();
  return getPendingPayouts();
}

export async function getCommissionMetricsAction(salesProfileId?: string) {
  await requireAuth();
  return getCommissionMetrics(salesProfileId);
}
