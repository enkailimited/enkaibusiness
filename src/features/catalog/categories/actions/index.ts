"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { createCategory, updateCategory, deleteCategory, getBusinessCategories, getCategory } from "../services/category-service";
import { createCategorySchema, updateCategorySchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createCategoryAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canCreate = await hasPermission(user.id, "catalog.create", businessId);
  if (!canCreate) {
    return { success: false, message: "You do not have permission to create categories" };
  }

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
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog`);
  }

  return result;
}

export async function updateCategoryAction(
  categoryId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const existing = await getCategory(categoryId);
  if (!existing) {
    return { success: false, message: "Category not found" };
  }

  const canUpdate = await hasPermission(user.id, "catalog.update", existing.businessId);
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to update categories" };
  }

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
    revalidatePath(`/workspaces/businesses/${existing.businessId}/commerce/catalog`);
  }

  return result;
}

export async function listCategoriesAction(businessId: string) {
  const user = await requireAuth();
  const canList = await hasPermission(user.id, "catalog.list", businessId);
  if (!canList) {
    return [];
  }
  return getBusinessCategories(businessId);
}

export async function deleteCategoryAction(
  businessId: string,
  categoryId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const canDelete = await hasPermission(user.id, "catalog.delete", businessId);
  if (!canDelete) {
    return { success: false, message: "You do not have permission to delete categories" };
  }
  const result = await deleteCategory(categoryId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog`);
  }

  return result;
}
