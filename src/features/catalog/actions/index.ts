"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createCatalogItem, updateCatalogItem, deleteCatalogItem } from "../services/catalog-service";
import { createCatalogItemSchema, updateCatalogItemSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createCatalogItemAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createCatalogItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    itemType: formData.get("itemType"),
    categoryId: formData.get("categoryId") || undefined,
    brandId: formData.get("brandId") || undefined,
    unitId: formData.get("unitId") || undefined,
    price: Number(formData.get("price")) || 0,
    costPrice: formData.get("costPrice") ? Number(formData.get("costPrice")) : undefined,
    taxRate: formData.get("taxRate") ? Number(formData.get("taxRate")) : undefined,
    currency: formData.get("currency") || "TZS",
    isService: formData.get("isService") === "true" || formData.get("isService") === "on",
    trackStock: formData.get("trackStock") !== "false" && formData.get("trackStock") !== "off",
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: true,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createCatalogItem(businessId, user.id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/catalog`);
  }

  return result;
}

export async function updateCatalogItemAction(
  itemId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = updateCatalogItemSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    itemType: formData.get("itemType") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    brandId: formData.get("brandId") || undefined,
    unitId: formData.get("unitId") || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    costPrice: formData.get("costPrice") ? Number(formData.get("costPrice")) : undefined,
    taxRate: formData.get("taxRate") ? Number(formData.get("taxRate")) : undefined,
    currency: formData.get("currency") || undefined,
    isService: formData.get("isService") === "true" || formData.get("isService") === "on",
    trackStock: formData.get("trackStock") !== "false" && formData.get("trackStock") !== "off",
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateCatalogItem(itemId, user.id, parsed.data);

  if (result.success) {
    const item = await import("../services/catalog-service").then((m) => m.getCatalogItem(itemId));
    if (item) {
      revalidatePath(`/workspaces/businesses/${item.businessId}/catalog`);
    }
  }

  return result;
}

export async function getCatalogItemAction(id: string) {
  await requireAuth();
  return import("../services/catalog-service").then((m) => m.getCatalogItem(id));
}

export async function listCatalogItemsAction(
  businessId: string,
  filter?: { itemType?: string; categoryId?: string; brandId?: string; search?: string; page?: number; limit?: number },
) {
  await requireAuth();
  return import("../services/catalog-service").then((m) => m.getBusinessCatalog(businessId, filter));
}

export async function deleteCatalogItemAction(
  businessId: string,
  itemId: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await deleteCatalogItem(itemId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/catalog`);
  }

  return result;
}
