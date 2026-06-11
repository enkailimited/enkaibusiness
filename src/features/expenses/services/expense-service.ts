import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateExpenseSchema, UpdateExpenseSchema, ExpenseFilterSchema } from "../schemas";
import type { ExpenseWithRelations } from "../types";

export async function createExpense(
  data: CreateExpenseSchema,
  businessId: string,
  workspaceId: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const expense = await prisma.expense.create({
      data: {
        workspaceId,
        businessId,
        branchId: data.branchId || null,
        storeId: data.storeId || null,
        categoryId: data.categoryId,
        staffId: data.staffId || null,
        amount: data.amount,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        description: data.description || null,
        paidTo: data.paidTo || null,
        status: data.status ?? "draft",
        createdById: createdById || null,
      },
    });

    return {
      success: true,
      message: "Expense created successfully",
      data: { id: expense.id },
    };
  } catch (error) {
    console.error("Create expense error:", error);
    return { success: false, message: "Failed to create expense" };
  }
}

export async function updateExpense(
  id: string,
  data: UpdateExpenseSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.staffId !== undefined) updateData.staffId = data.staffId || null;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.expenseDate !== undefined) updateData.expenseDate = new Date(data.expenseDate);
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.paidTo !== undefined) updateData.paidTo = data.paidTo || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.branchId !== undefined) updateData.branchId = data.branchId || null;
    if (data.storeId !== undefined) updateData.storeId = data.storeId || null;

    await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Expense updated successfully", data: { id } };
  } catch (error) {
    console.error("Update expense error:", error);
    return { success: false, message: "Failed to update expense" };
  }
}

export async function getExpense(id: string): Promise<ExpenseWithRelations | null> {
  const raw = await prisma.expense.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      staff: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!raw) return null;
  return raw as unknown as ExpenseWithRelations;
}

export async function listExpenses(
  businessId: string,
  filter?: ExpenseFilterSchema,
): Promise<ExpenseWithRelations[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.categoryId) where.categoryId = filter.categoryId;
  if (filter?.status) where.status = filter.status;
  if (filter?.staffId) where.staffId = filter.staffId;

  if (filter?.dateFrom || filter?.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filter.dateFrom) dateFilter.gte = new Date(filter.dateFrom);
    if (filter.dateTo) dateFilter.lte = new Date(filter.dateTo);
    where.expenseDate = dateFilter;
  }

  if (filter?.search) {
    where.OR = [
      { description: { contains: filter.search, mode: "insensitive" } },
      { paidTo: { contains: filter.search, mode: "insensitive" } },
      { reference: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const raw = await prisma.expense.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      staff: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { expenseDate: "desc" },
  });

  return raw as unknown as ExpenseWithRelations[];
}

export async function approveExpense(id: string, approvedById: string): Promise<ActionResponse> {
  try {
    await prisma.expense.update({
      where: { id },
      data: { status: "approved", approvedById },
    });
    return { success: true, message: "Expense approved" };
  } catch (error) {
    console.error("Approve expense error:", error);
    return { success: false, message: "Failed to approve expense" };
  }
}

export async function markExpenseAsPaid(id: string): Promise<ActionResponse> {
  try {
    await prisma.expense.update({
      where: { id },
      data: { status: "paid" },
    });
    return { success: true, message: "Expense marked as paid" };
  } catch (error) {
    console.error("Mark paid error:", error);
    return { success: false, message: "Failed to mark expense as paid" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResponse> {
  try {
    await prisma.expense.delete({ where: { id } });
    return { success: true, message: "Expense deleted successfully" };
  } catch (error) {
    console.error("Delete expense error:", error);
    return { success: false, message: "Failed to delete expense" };
  }
}
