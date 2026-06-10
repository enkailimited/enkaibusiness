"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createCatalogItem, deleteCatalogItem } from "@/server/services/catalog-service";
import { createCatalogItemSchema } from "@/lib/validations/catalog";
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
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || undefined,
    price: Number(formData.get("price")) || 0,
    costPrice: formData.get("costPrice") ? Number(formData.get("costPrice")) : undefined,
    taxRate: formData.get("taxRate") ? Number(formData.get("taxRate")) : undefined,
    currency: formData.get("currency") || "TZS",
    isService: formData.get("isService") === "true",
    trackStock: formData.get("trackStock") !== "false",
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
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}

export async function deleteCatalogItemAction(businessId: string, itemId: string) {
  await requireAuth();
  const result = await deleteCatalogItem(itemId);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}
