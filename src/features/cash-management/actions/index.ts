"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createRegister,
  updateRegister,
  getRegister,
  listRegisters,
  deleteRegister,
} from "../services/register-service";
import {
  recordTransaction,
  getRegisterTransactions,
  getCashSummary,
} from "../services/cash-service";
import {
  createRegisterSchema,
  updateRegisterSchema,
  createTransactionSchema,
  registerFilterSchema,
  transactionFilterSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createRegisterAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createRegisterSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currency: formData.get("currency") || undefined,
    openingBalance: formData.get("openingBalance") || undefined,
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createRegister(parsed.data, businessId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/cash-management`);
  }

  return result;
}

export async function updateRegisterAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateRegisterSchema.safeParse({
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
    currency: formData.get("currency") || undefined,
    openingBalance: formData.get("openingBalance") || undefined,
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateRegister(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/cash-management`);
  }

  return result;
}

export async function getRegisterAction(id: string) {
  await requireAuth();
  return getRegister(id);
}

export async function listRegistersAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? registerFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listRegisters(businessId, parsed.data);
}

export async function deleteRegisterAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteRegister(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/cash-management`);
  }
  return result;
}

export async function recordTransactionAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createTransactionSchema.safeParse({
    registerId: formData.get("registerId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
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

  const result = await recordTransaction(parsed.data, user.id);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/cash-management`);
  }

  return result;
}

export async function listTransactionsAction(
  registerId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? transactionFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return { data: [], total: 0, totalPages: 0 };
  }

  return getRegisterTransactions(registerId, parsed.data);
}

export async function getCashSummaryAction(businessId: string) {
  await requireAuth();
  return getCashSummary(businessId);
}
