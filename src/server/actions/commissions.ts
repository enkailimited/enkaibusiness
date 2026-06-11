"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { serialize } from "@/lib/utils";
import {
  createRule,
  getRules,
  updateRule,
  getLedger,
  approveCommission,
  createPayout,
  getPayouts,
  getCommissionMetrics,
} from "@/server/services/commission-service";
import {
  createCommissionRuleSchema,
  updateCommissionRuleSchema,
  createPayoutSchema,
} from "@/lib/validations/commission";
import type { ActionResponse } from "@/types/relationships";

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

export async function getCommissionRulesAction() {
  await requireAuth();
  const data = await getRules();
  return serialize(data);
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

export async function getCommissionLedgerAction(salesProfileId: string) {
  await requireAuth();
  const data = await getLedger(salesProfileId);
  return serialize(data);
}

export async function approveCommissionAction(ledgerId: string) {
  await requireAuth();
  const result = await approveCommission(ledgerId);

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
  const data = await getPayouts();
  return serialize(data);
}

export async function getCommissionMetricsAction(salesProfileId?: string) {
  await requireAuth();
  const data = await getCommissionMetrics(salesProfileId);
  return serialize(data);
}
