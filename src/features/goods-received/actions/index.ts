"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createGoodsReceived,
  updateGoodsReceived,
  getGoodsReceived,
  listGoodsReceived,
  deleteGoodsReceived,
} from "../services/goods-received-service";
import { createGoodsReceivedSchema, updateGoodsReceivedSchema, goodsReceivedFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createGoodsReceivedAction(
  workspaceId: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const items = [];
  let i = 0;
  while (formData.has(`items[${i}][catalogItemId]`)) {
    const itemForm = {
      catalogItemId: formData.get(`items[${i}][catalogItemId]`) as string,
      variantId: (formData.get(`items[${i}][variantId]`) as string) || undefined,
      expectedQuantity: formData.get(`items[${i}][expectedQuantity]`),
      receivedQuantity: formData.get(`items[${i}][receivedQuantity]`),
      unitCost: formData.get(`items[${i}][unitCost]`),
    };
    if (itemForm.catalogItemId) items.push(itemForm);
    i++;
  }

  const parsed = createGoodsReceivedSchema.safeParse({
    workspaceId,
    businessId,
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    purchaseOrderId: formData.get("purchaseOrderId") || undefined,
    staffId: formData.get("staffId") || undefined,
    receivedDate: formData.get("receivedDate") || undefined,
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
    createdById: formData.get("createdById") || undefined,
    items: items.length > 0 ? items : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createGoodsReceived(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/goods-received`);
  }

  return result;
}

export async function updateGoodsReceivedAction(
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
      expectedQuantity: formData.get(`items[${i}][expectedQuantity]`),
      receivedQuantity: formData.get(`items[${i}][receivedQuantity]`),
      unitCost: formData.get(`items[${i}][unitCost]`),
    };
    if (itemForm.catalogItemId) items.push(itemForm);
    i++;
  }

  const parsed = updateGoodsReceivedSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    staffId: formData.get("staffId") || undefined,
    receivedDate: formData.get("receivedDate") || undefined,
    reference: formData.get("reference") || undefined,
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

  const result = await updateGoodsReceived(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/goods-received`);
  }

  return result;
}

export async function getGoodsReceivedAction(id: string) {
  await requireAuth();
  return getGoodsReceived(id);
}

export async function listGoodsReceivedAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? goodsReceivedFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listGoodsReceived(businessId, parsed.data);
}

export async function deleteGoodsReceivedAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteGoodsReceived(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/goods-received`);
  }
  return result;
}
