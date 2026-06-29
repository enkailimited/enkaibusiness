"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { createBrand, updateBrand, deleteBrand, getBusinessBrands, getBrand } from "../services/brand-service";
import { createBrandSchema, updateBrandSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createBrandAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canCreate = await hasPermission(user.id, "catalog.create", businessId);
  if (!canCreate) {
    return { success: false, message: "You do not have permission to create brands" };
  }

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
    revalidatePath(`/workspaces/businesses/${businessId}/catalog`);
  }

  return result;
}

export async function updateBrandAction(
  brandId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const existing = await getBrand(brandId);
  if (!existing) {
    return { success: false, message: "Brand not found" };
  }

  const canUpdate = await hasPermission(user.id, "catalog.update", existing.businessId);
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to update brands" };
  }

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
    revalidatePath(`/workspaces/businesses/${existing.businessId}/catalog`);
  }

  return result;
}

export async function listBrandsAction(businessId: string) {
  const user = await requireAuth();
  const canList = await hasPermission(user.id, "catalog.list", businessId);
  if (!canList) {
    return [];
  }
  return getBusinessBrands(businessId);
}

export async function deleteBrandAction(
  businessId: string,
  brandId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const canDelete = await hasPermission(user.id, "catalog.delete", businessId);
  if (!canDelete) {
    return { success: false, message: "You do not have permission to delete brands" };
  }
  const result = await deleteBrand(brandId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/catalog`);
  }

  return result;
}
