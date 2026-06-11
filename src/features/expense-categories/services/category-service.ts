import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCategorySchema, UpdateCategorySchema } from "../schemas";
import type { ExpenseCategory, ExpenseCategoryWithCount } from "../types";

export async function createCategory(
  data: CreateCategorySchema,
  businessId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const category = await prisma.expenseCategory.create({
      data: {
        name: data.name,
        description: data.description || null,
        isActive: data.isActive ?? true,
        businessId,
      },
    });

    return {
      success: true,
      message: "Expense category created successfully",
      data: { id: category.id },
    };
  } catch (error) {
    console.error("Create category error:", error);
    return { success: false, message: "Failed to create expense category" };
  }
}

export async function updateCategory(
  id: string,
  data: UpdateCategorySchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return {
      success: true,
      message: "Expense category updated successfully",
      data: { id: category.id },
    };
  } catch (error) {
    console.error("Update category error:", error);
    return { success: false, message: "Failed to update expense category" };
  }
}

export async function getCategory(id: string): Promise<ExpenseCategory | null> {
  const raw = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!raw) return null;
  return raw as ExpenseCategory;
}

export async function getCategoryWithCount(id: string): Promise<ExpenseCategoryWithCount | null> {
  const raw = await prisma.expenseCategory.findUnique({
    where: { id },
    include: { _count: { select: { expenses: true } } },
  });
  if (!raw) return null;
  return raw as unknown as ExpenseCategoryWithCount;
}

export async function listCategories(businessId: string): Promise<ExpenseCategoryWithCount[]> {
  const raw = await prisma.expenseCategory.findMany({
    where: { businessId },
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: "asc" },
  });
  return raw as unknown as ExpenseCategoryWithCount[];
}

export async function deleteCategory(id: string): Promise<ActionResponse> {
  try {
    await prisma.expenseCategory.delete({ where: { id } });
    return { success: true, message: "Expense category deleted successfully" };
  } catch (error) {
    console.error("Delete category error:", error);
    return { success: false, message: "Failed to delete expense category" };
  }
}
