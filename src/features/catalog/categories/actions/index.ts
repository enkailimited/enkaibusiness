"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createCategory, updateCategory, deleteCategory, getBusinessCategories } from "../services/category-service";
import { createCategorySchema, updateCategorySchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createCategoryAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    parentId: formData.get("parentId") || undefined,
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createCategory(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}

export async function updateCategoryAction(
  categoryId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateCategorySchema.safeParse({
    name: formData.get("name") || undefined,
    parentId: formData.get("parentId") || null,
    description: formData.get("description") || null,
    imageUrl: formData.get("imageUrl") || null,
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : undefined,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateCategory(categoryId, parsed.data);

  if (result.success) {
    const category = await import("../services/category-service").then((m) => m.getCategory(categoryId));
    if (category) {
      revalidatePath(`/businesses/${category.businessId}/catalog`);
    }
  }

  return result;
}

export async function listCategoriesAction(businessId: string) {
  await requireAuth();
  return getBusinessCategories(businessId);
}

export async function deleteCategoryAction(
  businessId: string,
  categoryId: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await deleteCategory(categoryId);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}
