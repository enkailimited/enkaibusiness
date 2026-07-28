"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { createAssignmentSchema, updateAssignmentSchema } from "../schemas";
import {
  createAssignment,
  updateAssignment,
  getAssignmentsForItem,
  removeAssignment,
} from "../services/assignment-service";
import type { ActionResponse } from "@/types/relationships";

export async function createAssignmentAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const businessId = formData.get("businessId") as string;

  const canCreate = await hasPermission(user.id, "catalog.create", businessId);
  if (!canCreate) {
    return { success: false, message: "You do not have permission to create assignments" };
  }

  const parsed = createAssignmentSchema.safeParse({
    businessId,
    catalogItemId: formData.get("catalogItemId"),
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    isAvailable: formData.get("isAvailable") === "true",
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createAssignment(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${parsed.data.businessId}/commerce/catalog`);
  }

  return result;
}

export async function updateAssignmentAction(
  assignmentId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const existing = await prisma.catalogItemAssignment.findUnique({
    where: { id: assignmentId },
    select: { businessId: true },
  });
  if (!existing) {
    return { success: false, message: "Assignment not found" };
  }

  const canUpdate = await hasPermission(user.id, "catalog.update", existing.businessId);
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to update assignments" };
  }

  const parsed = updateAssignmentSchema.safeParse({
    isAvailable: formData.get("isAvailable") !== undefined
      ? formData.get("isAvailable") === "true"
      : undefined,
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return updateAssignment(assignmentId, parsed.data);
}

export async function getAssignmentsForItemAction(catalogItemId: string) {
  await requireAuth();
  return getAssignmentsForItem(catalogItemId);
}

export async function removeAssignmentAction(
  assignmentId: string,
  businessId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canDelete = await hasPermission(user.id, "catalog.delete", businessId);
  if (!canDelete) {
    return { success: false, message: "You do not have permission to remove assignments" };
  }

  const result = await removeAssignment(assignmentId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog`);
  }

  return result;
}
