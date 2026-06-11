"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getWallet,
  getWalletInfo,
  recordTransaction,
  getTransactions,
  addBonus,
} from "../services/wallet-service";
import { createWalletTransactionSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function getWalletAction(businessId: string) {
  await requireAuth();
  return getWallet(businessId);
}

export async function getWalletInfoAction(businessId: string) {
  await requireAuth();
  return getWalletInfo(businessId);
}

export async function recordDepositAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createWalletTransactionSchema.safeParse({
    type: "deposit",
    amount: Number(formData.get("amount")) || 0,
    reference: formData.get("reference") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await recordTransaction(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/subscriptions/wallet`);
  }

  return result;
}

export async function recordTransactionAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createWalletTransactionSchema.safeParse({
    type: formData.get("type"),
    amount: Number(formData.get("amount")) || 0,
    reference: formData.get("reference") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await recordTransaction(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/subscriptions/wallet`);
  }

  return result;
}

export async function getTransactionsAction(
  businessId: string,
  page?: number,
  limit?: number,
) {
  await requireAuth();
  return getTransactions(businessId, { page, limit });
}

export async function addBonusAction(
  businessId: string,
  amount: number,
  description?: string,
) {
  await requireAuth();
  const result = await addBonus(businessId, amount, description);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/subscriptions/wallet`);
  }

  return result;
}
