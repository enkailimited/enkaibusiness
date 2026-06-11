"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createExpense,
  updateExpense,
  getExpense,
  listExpenses,
  approveExpense,
  markExpenseAsPaid,
  deleteExpense,
} from "../services/expense-service";
import { createExpenseSchema, updateExpenseSchema, expenseFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createExpenseAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createExpenseSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate") || undefined,
    description: formData.get("description") || undefined,
    paidTo: formData.get("paidTo") || undefined,
    status: formData.get("status") || "draft",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createExpense(parsed.data, businessId, user.workspaceId, user.id);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/expenses`);
  }

  return result;
}

export async function updateExpenseAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateExpenseSchema.safeParse({
    categoryId: formData.get("categoryId") || undefined,
    amount: formData.get("amount") || undefined,
    expenseDate: formData.get("expenseDate") || undefined,
    description: formData.get("description") || undefined,
    paidTo: formData.get("paidTo") || undefined,
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateExpense(id, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/expenses`);
  }

  return result;
}

export async function getExpenseAction(id: string) {
  await requireAuth();
  return getExpense(id);
}

export async function listExpensesAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? expenseFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listExpenses(businessId, parsed.data);
}

export async function approveExpenseAction(id: string, businessId: string) {
  const user = await requireAuth();
  const result = await approveExpense(id, user.id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/expenses`);
  }
  return result;
}

export async function markExpenseAsPaidAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markExpenseAsPaid(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/expenses`);
  }
  return result;
}

export async function deleteExpenseAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteExpense(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/expenses`);
  }
  return result;
}
