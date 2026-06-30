"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { updateStaffSchema, createAssignmentSchema } from "../schemas";
import {
  updateStaff,
  getStaff,
  deleteStaff,
  createAssignment,
  removeAssignment,
} from "../services/staff-service";
import type { ActionResponse } from "@/types/relationships";

export async function updateStaffAction(
  staffId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateStaffSchema.safeParse({
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    employeeCode: formData.get("employeeCode") || undefined,
    position: formData.get("position") || undefined,
    hireDate: formData.get("hireDate") || undefined,
    isActive: formData.get("isActive") === "true" ? true : formData.get("isActive") === "false" ? false : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const staff = await getStaff(staffId);
  if (!staff) {
    return { success: false, message: "Staff not found" };
  }

  const { firstName, lastName, email, phone, ...staffData } = parsed.data;

  if (firstName !== undefined || lastName !== undefined || email !== undefined || phone !== undefined) {
    const userUpdate: Record<string, string | null | undefined> = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (email !== undefined) userUpdate.email = email;
    if (phone !== undefined) userUpdate.phone = phone || null;
    await prisma.user.update({ where: { id: staff.userId }, data: userUpdate });
  }

  const result = await updateStaff(staffId, staffData);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${staff.businessId}/commerce/staff`);
  }

  return result;
}

export async function createStaffAssignmentAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createAssignmentSchema.safeParse({
    staffId: formData.get("staffId"),
    level: formData.get("level"),
    businessId: formData.get("businessId"),
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    roleId: formData.get("roleId") || undefined,
    isPrimary: formData.get("isPrimary") === "true",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return createAssignment(parsed.data);
}

export async function removeStaffAssignmentAction(
  assignmentId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await removeAssignment(assignmentId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/staff`);
  }

  return result;
}

export async function deleteStaffAction(
  staffId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await deleteStaff(staffId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/staff`);
  }

  return result;
}
