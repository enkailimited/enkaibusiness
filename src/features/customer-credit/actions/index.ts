"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createAccount,
  updateAccount,
  getAccount,
  getAccounts,
  recordTransaction,
  getTransactions,
} from "../services/credit-service";
import {
  createAccountSchema,
  updateAccountSchema,
  creditTransactionSchema,
  accountFilterSchema,
  transactionFilterSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createAccountAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createAccountSchema.safeParse({
    customerId: formData.get("customerId"),
    creditLimit: formData.get("creditLimit") || 0,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createAccount(parsed.data, businessId, user.id);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/credit-accounts`);
  }

  return result;
}

export async function updateAccountAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateAccountSchema.safeParse({
    creditLimit: formData.get("creditLimit") || undefined,
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateAccount(id, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/credit-accounts`);
  }

  return result;
}

export async function getAccountAction(id: string) {
  await requireAuth();
  return getAccount(id);
}

export async function listAccountsAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? accountFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return getAccounts(businessId, parsed.data);
}

export async function recordTransactionAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = creditTransactionSchema.safeParse({
    accountId: formData.get("accountId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
    reference: formData.get("reference") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await recordTransaction(parsed.data, user.id);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/credit-accounts`);
  }

  return result;
}

export async function getTransactionsAction(
  accountId: string,
  filter?: Record<string, unknown>,
  page?: number,
  limit?: number,
) {
  await requireAuth();

  const parsed = filter ? transactionFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  return getTransactions(accountId, parsed.data, page, limit);
}
