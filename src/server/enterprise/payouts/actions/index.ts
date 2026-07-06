"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getPayoutMethods,
  createPayoutMethod,
  updatePayoutMethod,
  deletePayoutMethod,
  setDefaultMethod,
  verifyPayoutMethod,
  getMethodsByType,
} from "../services/payout-method-service";
import {
  createBatchPayoutWithMethods,
  processBulkPayout,
  getPayoutHistory,
  getPayoutHistoryByMethod,
  getPendingPayoutsSummary,
} from "../services/payout-v2-service";
import {
  createPayoutMethodSchema,
  updatePayoutMethodSchema,
  setDefaultMethodSchema,
  createBatchPayoutSchema,
  processBulkPayoutSchema,
  getPayoutHistorySchema,
  getPayoutHistoryByMethodSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function getPayoutMethodsAction(salesProfileId: string) {
  await requireAuth();
  return getPayoutMethods(salesProfileId);
}

export async function createPayoutMethodAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const raw: Record<string, unknown> = {
    salesProfileId: formData.get("salesProfileId"),
    type: formData.get("type"),
    label: formData.get("label") || undefined,
    details: formData.get("details") ? JSON.parse(formData.get("details") as string) : {},
  };

  const parsed = createPayoutMethodSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const method = await createPayoutMethod(parsed.data.salesProfileId, parsed.data.type, parsed.data.details, parsed.data.label);
    revalidatePath("/enterprise/payouts");
    return { success: true, message: "Payout method created", data: { id: method.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create payout method" };
  }
}

export async function updatePayoutMethodAction(
  id: string,
  data: Record<string, unknown>,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updatePayoutMethodSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updatePayoutMethod(id, parsed.data.details);
    revalidatePath("/enterprise/payouts");
    return { success: true, message: "Payout method updated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update payout method" };
  }
}

export async function deletePayoutMethodAction(id: string): Promise<ActionResponse> {
  await requireAuth();

  try {
    const result = await deletePayoutMethod(id);
    if (result.success) revalidatePath("/enterprise/payouts");
    return result;
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to delete payout method" };
  }
}

export async function setDefaultMethodAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = setDefaultMethodSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await setDefaultMethod(parsed.data.salesProfileId, parsed.data.methodId);
    revalidatePath("/enterprise/payouts");
    return result;
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to set default method" };
  }
}

export async function verifyPayoutMethodAction(id: string): Promise<ActionResponse> {
  await requireAuth();

  try {
    await verifyPayoutMethod(id);
    revalidatePath("/enterprise/payouts");
    return { success: true, message: "Payout method verified" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to verify payout method" };
  }
}

export async function getMethodsByTypeAction(type: string) {
  await requireAuth();
  return getMethodsByType(type as any);
}

export async function createBatchPayoutAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createBatchPayoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return createBatchPayoutWithMethods(parsed.data.entries, parsed.data.methodId, parsed.data.notes);
}

export async function processBulkPayoutAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = processBulkPayoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return processBulkPayout(parsed.data.payoutId, parsed.data.transactionRef);
}

export async function getPayoutHistoryAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = getPayoutHistorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const history = await getPayoutHistory(parsed.data.salesProfileId);
    return { success: true, message: "Payout history retrieved", data: history };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to get payout history" };
  }
}

export async function getPayoutHistoryByMethodAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = getPayoutHistoryByMethodSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const history = await getPayoutHistoryByMethod(parsed.data.methodType);
    return { success: true, message: "Payout history by method retrieved", data: history };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to get payout history" };
  }
}

export async function getPendingPayoutsSummaryAction() {
  await requireAuth();
  return getPendingPayoutsSummary();
}
