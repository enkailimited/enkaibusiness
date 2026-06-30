"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createPriceListSchema, updatePriceListSchema } from "../schemas";
import {
  createPriceList,
  updatePriceList,
  getPriceList,
  listPriceLists,
  deletePriceList,
  addPriceListItem,
  removePriceListItem,
  updatePriceListItem,
} from "../services/price-list-service";
import type { ActionResponse } from "@/types/relationships";

export async function createPriceListAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();
  const businessId = formData.get("businessId") as string;

  const items: Array<Record<string, unknown>> = [];
  let i = 0;
  while (formData.has(`items.${i}.catalogItemId`)) {
    items.push({
      catalogItemId: formData.get(`items.${i}.catalogItemId`),
      unitPrice: Number(formData.get(`items.${i}.unitPrice`)) || 0,
      minQuantity: Number(formData.get(`items.${i}.minQuantity`)) || 1,
    });
    i++;
  }

  const parsed = createPriceListSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    priority: Number(formData.get("priority")) || 0,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    isActive: formData.get("isActive") === "true",
    items,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createPriceList(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog/pricing`);
  }

  return result;
}

export async function updatePriceListAction(
  priceListId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();
  const businessId = formData.get("businessId") as string;

  const parsed = updatePriceListSchema.safeParse({
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
    priority: formData.get("priority") ? Number(formData.get("priority")) : undefined,
    startDate: formData.get("startDate") || null,
    endDate: formData.get("endDate") || null,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updatePriceList(priceListId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog/pricing`);
  }

  return result;
}

export async function listPriceListsAction(
  businessId: string,
  options?: { type?: string; isActive?: boolean },
) {
  await requireAuth();
  return listPriceLists(businessId, options);
}

export async function getPriceListAction(id: string) {
  await requireAuth();
  return getPriceList(id);
}

export async function deletePriceListAction(
  priceListId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await deletePriceList(priceListId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog/pricing`);
  }

  return result;
}

export async function addPriceListItemAction(
  priceListId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data = {
    catalogItemId: formData.get("catalogItemId") as string,
    variantId: (formData.get("variantId") as string) || undefined,
    unitPrice: Number(formData.get("unitPrice")) || 0,
    minQuantity: Number(formData.get("minQuantity")) || 1,
  };

  if (!data.catalogItemId) {
    return { success: false, message: "Catalog item ID is required" };
  }

  return addPriceListItem(priceListId, data);
}

export async function removePriceListItemAction(
  itemId: string,
  priceListId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await removePriceListItem(itemId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog/pricing`);
  }

  return result;
}
