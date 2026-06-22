"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createProductSchema, updateProductSchema } from "../schemas";
import {
  createProduct,
  updateProduct,
  getProduct,
  listProducts,
  deleteProduct,
  addProductVariant,
  updateProductVariant,
  removeProductVariant,
} from "../services/product-service";
import type { ActionResponse } from "@/types/relationships";

export async function createProductAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const businessId = formData.get("businessId") as string;

  const variants: Array<Record<string, unknown>> = [];
  let i = 0;
  while (formData.has(`variants.${i}.name`)) {
    variants.push({
      name: formData.get(`variants.${i}.name`),
      sku: formData.get(`variants.${i}.sku`) || undefined,
      barcode: formData.get(`variants.${i}.barcode`) || undefined,
      price: formData.get(`variants.${i}.price`) ? Number(formData.get(`variants.${i}.price`)) : undefined,
      costPrice: formData.get(`variants.${i}.costPrice`) ? Number(formData.get(`variants.${i}.costPrice`)) : undefined,
      sortOrder: i,
    });
    i++;
  }

  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    itemType: "PRODUCT",
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || undefined,
    price: Number(formData.get("price")) || 0,
    costPrice: formData.get("costPrice") ? Number(formData.get("costPrice")) : undefined,
    currency: formData.get("currency") || "TZS",
    isService: false,
    trackStock: formData.get("trackStock") === "true",
    imageUrl: formData.get("imageUrl") || undefined,
    variants,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createProduct(businessId, user.id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/catalog/products`);
  }

  return result;
}

export async function updateProductAction(
  productId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const businessId = formData.get("businessId") as string;

  const parsed = updateProductSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    itemType: "PRODUCT",
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    costPrice: formData.get("costPrice") ? Number(formData.get("costPrice")) : undefined,
    currency: formData.get("currency") || undefined,
    isService: false,
    trackStock: formData.get("trackStock") !== undefined ? formData.get("trackStock") === "true" : undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateProduct(productId, user.id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/catalog/products`);
  }

  return result;
}

export async function listProductsAction(
  businessId: string,
  filters?: { category?: string; search?: string; isActive?: boolean },
): Promise<ActionResponse & { data?: unknown[] }> {
  await requireAuth();
  return listProducts(businessId, { ...filters, itemType: "PRODUCT" } as Record<string, unknown> as any);
}

export async function deleteProductAction(
  productId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await deleteProduct(productId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/catalog/products`);
  }

  return result;
}

export async function addProductVariantAction(
  productId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data = {
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || undefined,
    barcode: (formData.get("barcode") as string) || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    costPrice: formData.get("costPrice") ? Number(formData.get("costPrice")) : undefined,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
  };

  if (!data.name) {
    return { success: false, message: "Variant name is required" };
  }

  return addProductVariant(productId, data);
}

export async function removeProductVariantAction(
  variantId: string,
  productId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await removeProductVariant(variantId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/catalog/products`);
  }

  return result;
}
