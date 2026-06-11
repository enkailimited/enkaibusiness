"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
  getBusinessPurchaseOrders,
  deletePurchaseOrder,
  approvePurchaseOrder,
  markPurchaseOrderAsSent,
  markPurchaseOrderAsReceived,
} from "../services/purchase-order-service";
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, purchaseOrderFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createPurchaseOrderAction(
  businessId: string,
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const items: Array<{
    catalogItemId: string;
    variantId?: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }> = [];

  const itemCount = parseInt(formData.get("itemCount") as string) || 0;
  for (let i = 0; i < itemCount; i++) {
    const catalogItemId = formData.get(`items.${i}.catalogItemId`) as string;
    if (!catalogItemId) continue;
    items.push({
      catalogItemId,
      variantId: (formData.get(`items.${i}.variantId`) as string) || undefined,
      quantity: parseFloat(formData.get(`items.${i}.quantity`) as string) || 0,
      unitCost: parseFloat(formData.get(`items.${i}.unitCost`) as string) || 0,
      subtotal: parseFloat(formData.get(`items.${i}.subtotal`) as string) || 0,
    });
  }

  const parsed = createPurchaseOrderSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    supplierId: formData.get("supplierId"),
    staffId: formData.get("staffId") || undefined,
    orderDate: formData.get("orderDate") || undefined,
    expectedDate: formData.get("expectedDate") || undefined,
    status: formData.get("status") || "draft",
    tax: formData.get("tax") || 0,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createPurchaseOrder(parsed.data, businessId, workspaceId, user.id);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/purchase-orders`);
  }

  return result;
}

export async function updatePurchaseOrderAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const items: Array<{
    catalogItemId: string;
    variantId?: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }> = [];

  const itemCount = parseInt(formData.get("itemCount") as string) || 0;
  for (let i = 0; i < itemCount; i++) {
    const catalogItemId = formData.get(`items.${i}.catalogItemId`) as string;
    if (!catalogItemId) continue;
    items.push({
      catalogItemId,
      variantId: (formData.get(`items.${i}.variantId`) as string) || undefined,
      quantity: parseFloat(formData.get(`items.${i}.quantity`) as string) || 0,
      unitCost: parseFloat(formData.get(`items.${i}.unitCost`) as string) || 0,
      subtotal: parseFloat(formData.get(`items.${i}.subtotal`) as string) || 0,
    });
  }

  const parsed = updatePurchaseOrderSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    supplierId: formData.get("supplierId") || undefined,
    staffId: formData.get("staffId") || undefined,
    orderDate: formData.get("orderDate") || undefined,
    expectedDate: formData.get("expectedDate") || undefined,
    status: formData.get("status") || undefined,
    tax: formData.get("tax") !== null ? formData.get("tax") : undefined,
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

  const result = await updatePurchaseOrder(id, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/purchase-orders`);
  }

  return result;
}

export async function getPurchaseOrderAction(id: string) {
  await requireAuth();
  return getPurchaseOrder(id);
}

export async function listPurchaseOrdersAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? purchaseOrderFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return getBusinessPurchaseOrders(businessId, parsed.data);
}

export async function deletePurchaseOrderAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deletePurchaseOrder(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/purchase-orders`);
  }
  return result;
}

export async function approvePurchaseOrderAction(id: string, businessId: string) {
  await requireAuth();
  const result = await approvePurchaseOrder(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/purchase-orders`);
  }
  return result;
}

export async function sendPurchaseOrderAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markPurchaseOrderAsSent(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/purchase-orders`);
  }
  return result;
}

export async function receivePurchaseOrderAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markPurchaseOrderAsReceived(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/purchase-orders`);
  }
  return result;
}
