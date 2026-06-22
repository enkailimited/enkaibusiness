"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createBrand, updateBrand, deleteBrand, getBusinessBrands } from "../services/brand-service";
import { createBrandSchema, updateBrandSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createBrandAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createBrandSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createBrand(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}

export async function updateBrandAction(
  brandId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateBrandSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || null,
    logoUrl: formData.get("logoUrl") || null,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateBrand(brandId, parsed.data);

  if (result.success) {
    const brand = await import("../services/brand-service").then((m) => m.getBrand(brandId));
    if (brand) {
      revalidatePath(`/businesses/${brand.businessId}/catalog`);
    }
  }

  return result;
}

export async function listBrandsAction(businessId: string) {
  await requireAuth();
  return getBusinessBrands(businessId);
}

export async function deleteBrandAction(
  businessId: string,
  brandId: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await deleteBrand(brandId);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}
