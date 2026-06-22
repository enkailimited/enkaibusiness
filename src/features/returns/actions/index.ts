"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createReturn,
  updateReturn,
  getReturn,
  getReturnWithRelations,
  listReturns,
  approveReturn,
  rejectReturn,
  deleteReturn,
} from "../services/return-service";
import { createReturnSchema, updateReturnSchema, returnFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createReturnAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const items: Array<{ catalogItemId: string; variantId?: string; quantity: number; unitPrice: number; reason?: string; condition?: string }> = [];
  let i = 0;
  while (formData.get(`items[${i}][quantity]`)) {
    items.push({
      catalogItemId: formData.get(`items[${i}][catalogItemId]`) as string,
      variantId: formData.get(`items[${i}][variantId]`) || undefined,
      quantity: Number(formData.get(`items[${i}][quantity]`)),
      unitPrice: Number(formData.get(`items[${i}][unitPrice]`)),
      reason: formData.get(`items[${i}][reason]`) || undefined,
      condition: formData.get(`items[${i}][condition]`) || undefined,
    });
    i++;
  }

  const parsed = createReturnSchema.safeParse({
    saleId: formData.get("saleId"),
    storeId: formData.get("storeId") || undefined,
    reason: formData.get("reason"),
    refundAmount: formData.get("refundAmount"),
    refundMethod: formData.get("refundMethod") || undefined,
    notes: formData.get("notes") || undefined,
    items: items.length > 0 ? items : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createReturn(parsed.data, businessId, user.workspaceId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/returns`);
  }

  return result;
}

export async function updateReturnAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateReturnSchema.safeParse({
    reason: formData.get("reason") || undefined,
    refundAmount: formData.get("refundAmount") || undefined,
    refundMethod: formData.get("refundMethod") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateReturn(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/returns`);
  }

  return result;
}

export async function getReturnAction(id: string) {
  await requireAuth();
  return getReturn(id);
}

export async function getReturnWithRelationsAction(id: string) {
  await requireAuth();
  return getReturnWithRelations(id);
}

export async function listReturnsAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? returnFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listReturns(businessId, parsed.data);
}

export async function approveReturnAction(id: string, businessId: string) {
  await requireAuth();
  const result = await approveReturn(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/returns`);
  }
  return result;
}

export async function rejectReturnAction(id: string, businessId: string) {
  await requireAuth();
  const result = await rejectReturn(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/returns`);
  }
  return result;
}

export async function deleteReturnAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteReturn(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/returns`);
  }
  return result;
}
