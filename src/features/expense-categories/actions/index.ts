"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  createCategory,
  updateCategory,
  getCategory,
  getCategoryWithCount,
  listCategories,
  deleteCategory,
} from "../services/category-service";
import { createCategorySchema, updateCategorySchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createCategoryAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "expense_categories.create", businessId);
  if (!can) return { success: false, message: "You do not have permission to create expense categories" };

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") ?? true,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createCategory(parsed.data, businessId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/expense-categories`);
  }

  return result;
}

export async function updateCategoryAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "expense_categories.update", businessId);
  if (!can) return { success: false, message: "You do not have permission to update expense categories" };

  const parsed = updateCategorySchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateCategory(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/expense-categories`);
  }

  return result;
}

export async function getCategoryAction(id: string) {
  await requireAuth();
  return getCategory(id);
}

export async function getCategoryWithCountAction(id: string) {
  await requireAuth();
  return getCategoryWithCount(id);
}

export async function listCategoriesAction(businessId: string) {
  await requireAuth();
  return listCategories(businessId);
}

export async function deleteCategoryAction(id: string, businessId: string) {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "expense_categories.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission to delete expense categories" };
  const result = await deleteCategory(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/expense-categories`);
  }
  return result;
}
