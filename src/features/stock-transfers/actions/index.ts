"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createTransfer,
  updateTransfer,
  getTransfer,
  listTransfers,
  deleteTransfer,
  dispatchTransfer,
  receiveTransfer,
} from "../services/transfer-service";
import { createTransferSchema, updateTransferSchema, transferFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createTransferAction(
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
      quantity: formData.get(`items[${i}][quantity]`),
    };
    if (itemForm.catalogItemId) items.push(itemForm);
    i++;
  }

  const parsed = createTransferSchema.safeParse({
    businessId,
    businessToId: formData.get("businessToId"),
    fromLocationId: formData.get("fromLocationId"),
    toLocationId: formData.get("toLocationId"),
    transferDate: formData.get("transferDate") || undefined,
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

  const result = await createTransfer(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-transfers`);
  }

  return result;
}

export async function updateTransferAction(
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
      quantity: formData.get(`items[${i}][quantity]`),
    };
    if (itemForm.catalogItemId) items.push(itemForm);
    i++;
  }

  const parsed = updateTransferSchema.safeParse({
    businessToId: formData.get("businessToId") || undefined,
    fromLocationId: formData.get("fromLocationId") || undefined,
    toLocationId: formData.get("toLocationId") || undefined,
    transferDate: formData.get("transferDate") || undefined,
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

  const result = await updateTransfer(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-transfers`);
  }

  return result;
}

export async function getTransferAction(id: string) {
  await requireAuth();
  return getTransfer(id);
}

export async function listTransfersAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? transferFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listTransfers(businessId, parsed.data);
}

export async function deleteTransferAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteTransfer(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-transfers`);
  }
  return result;
}

export async function dispatchTransferAction(
  id: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await dispatchTransfer(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-transfers`);
  }
  return result;
}

export async function receiveTransferAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const items = [];
  let i = 0;
  while (formData.has(`items[${i}][id]`)) {
    const itemId = formData.get(`items[${i}][id]`) as string;
    const receivedQuantity = formData.get(`items[${i}][receivedQuantity]`);
    if (itemId) {
      items.push({ id: itemId, receivedQuantity: Number(receivedQuantity) });
    }
    i++;
  }

  const result = await receiveTransfer(id, items.length > 0 ? items : undefined);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/stock-transfers`);
  }

  return result;
}
