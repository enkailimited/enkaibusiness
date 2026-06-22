"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createPurchase,
  updatePurchase,
  getPurchase,
  getBusinessPurchases,
  deletePurchase,
} from "../services/purchase-service";
import { createPurchaseSchema, updatePurchaseSchema, purchaseFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createPurchaseAction(
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

  const parsed = createPurchaseSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    supplierId: formData.get("supplierId"),
    staffId: formData.get("staffId") || undefined,
    purchaseDate: formData.get("purchaseDate") || undefined,
    reference: formData.get("reference") || undefined,
    status: formData.get("status") || "completed",
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

  const result = await createPurchase(parsed.data, businessId, workspaceId, user.id);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/purchases`);
  }

  return result;
}

export async function updatePurchaseAction(
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

  const parsed = updatePurchaseSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    supplierId: formData.get("supplierId") || undefined,
    staffId: formData.get("staffId") || undefined,
    purchaseDate: formData.get("purchaseDate") || undefined,
    reference: formData.get("reference") || undefined,
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

  const result = await updatePurchase(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/purchases`);
  }

  return result;
}

export async function getPurchaseAction(id: string) {
  await requireAuth();
  return getPurchase(id);
}

export async function listPurchasesAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? purchaseFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return getBusinessPurchases(businessId, parsed.data);
}

export async function deletePurchaseAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deletePurchase(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/purchases`);
  }
  return result;
}
