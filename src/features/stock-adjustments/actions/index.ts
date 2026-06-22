"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createAdjustment,
  updateAdjustment,
  getAdjustment,
  listAdjustments,
  deleteAdjustment,
  approveAdjustment,
} from "../services/adjustment-service";
import { createAdjustmentSchema, updateAdjustmentSchema, adjustmentFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createAdjustmentAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const items = [];
  let i = 0;
  while (formData.has(`items[${i}][catalogItemId]`)) {
    const itemForm = {
      catalogItemId: formData.get(`items[${i}][catalogItemId]`) as string,
      variantId: (formData.get(`items[${i}][variantId]`) as string) || undefined,
      expectedQty: formData.get(`items[${i}][expectedQty]`),
      actualQty: formData.get(`items[${i}][actualQty]`),
      reason: (formData.get(`items[${i}][reason]`) as string) || undefined,
    };
    if (itemForm.catalogItemId) items.push(itemForm);
    i++;
  }

  const parsed = createAdjustmentSchema.safeParse({
    businessId,
    locationId: formData.get("locationId"),
    adjustmentDate: formData.get("adjustmentDate") || undefined,
    reason: formData.get("reason"),
    notes: formData.get("notes") || undefined,
    createdById: user.id,
    items: items.length > 0 ? items : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createAdjustment(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-adjustments`);
  }

  return result;
}

export async function updateAdjustmentAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const items = [];
  let i = 0;
  while (formData.has(`items[${i}][catalogItemId]`)) {
    const itemForm = {
      id: (formData.get(`items[${i}][id]`) as string) || undefined,
      catalogItemId: formData.get(`items[${i}][catalogItemId]`) as string,
      variantId: (formData.get(`items[${i}][variantId]`) as string) || undefined,
      expectedQty: formData.get(`items[${i}][expectedQty]`),
      actualQty: formData.get(`items[${i}][actualQty]`),
      reason: (formData.get(`items[${i}][reason]`) as string) || undefined,
    };
    if (itemForm.catalogItemId) items.push(itemForm);
    i++;
  }

  const parsed = updateAdjustmentSchema.safeParse({
    locationId: formData.get("locationId") || undefined,
    adjustmentDate: formData.get("adjustmentDate") || undefined,
    reason: formData.get("reason") || undefined,
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

  const result = await updateAdjustment(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-adjustments`);
  }

  return result;
}

export async function getAdjustmentAction(id: string) {
  await requireAuth();
  return getAdjustment(id);
}

export async function listAdjustmentsAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? adjustmentFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listAdjustments(businessId, parsed.data);
}

export async function deleteAdjustmentAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteAdjustment(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-adjustments`);
  }
  return result;
}

export async function approveAdjustmentAction(
  id: string,
  businessId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const result = await approveAdjustment(id, user.id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-adjustments`);
  }
  return result;
}
