"use server";

import { revalidatePath } from "next/cache";
import {
  createRole, updateRole, deleteRole,
  createPermission,
  assignPermissionToRole, removePermissionFromRole,
  assignRoleToUser, removeRoleFromUser,
} from "../services/rbac-service";
import { createRoleSchema, updateRoleSchema, createPermissionSchema } from "../schemas";

export async function createRoleAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createRoleSchema.safeParse(raw);
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  const role = await createRole(parsed.data);
  revalidatePath("/platform/roles");
  return { success: true, data: role };
}

export async function updateRoleAction(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = updateRoleSchema.safeParse(raw);
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  const role = await updateRole(id, parsed.data);
  revalidatePath("/platform/roles");
  return { success: true, data: role };
}

export async function deleteRoleAction(id: string) {
  await deleteRole(id);
  revalidatePath("/platform/roles");
  return { success: true };
}

export async function createPermissionAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createPermissionSchema.safeParse(raw);
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  const permission = await createPermission(parsed.data);
  revalidatePath("/platform/roles");
  return { success: true, data: permission };
}

export async function assignPermissionToRoleAction(roleId: string, permissionId: string) {
  await assignPermissionToRole(roleId, permissionId);
  revalidatePath("/platform/roles");
  return { success: true };
}

export async function removePermissionFromRoleAction(roleId: string, permissionId: string) {
  await removePermissionFromRole(roleId, permissionId);
  revalidatePath("/platform/roles");
  return { success: true };
}

export async function assignRoleToUserAction(userId: string, roleId: string, businessId?: string) {
  await assignRoleToUser(userId, roleId, businessId);
  revalidatePath("/platform/users");
  return { success: true };
}

export async function removeRoleFromUserAction(userId: string, roleId: string, businessId?: string) {
  await removeRoleFromUser(userId, roleId, businessId);
  revalidatePath("/platform/users");
  return { success: true };
}
