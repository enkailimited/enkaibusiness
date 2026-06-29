"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createRole, updateRole, deleteRole, assignPermissionToRole, removePermissionFromRole } from "../services/role-service";
import { assignRoleToUser, removeRoleFromUser, hasPermission } from "../services/assignment-service";
import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import { createRoleSchema, updateRoleSchema, assignPermissionToRoleSchema, assignRoleSchema } from "../schemas";

export async function createRoleAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "roles.create");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = createRoleSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    scope: formData.get("scope"),
    businessId: formData.get("businessId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await createRole(parsed.data);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function updateRoleAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "roles.update");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = updateRoleSchema.safeParse({
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    scope: formData.get("scope") || undefined,
    businessId: formData.get("businessId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await updateRole(id, parsed.data);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function deleteRoleAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "roles.delete");
  if (!can) return { success: false, message: "Unauthorized" };

  const result = await deleteRole(id);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function assignPermissionAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "roles.assign-permissions");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = assignPermissionToRoleSchema.safeParse({
    roleId: formData.get("roleId"),
    permissionId: formData.get("permissionId"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await assignPermissionToRole(parsed.data.roleId, parsed.data.permissionId);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function removePermissionAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "roles.assign-permissions");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = assignPermissionToRoleSchema.safeParse({
    roleId: formData.get("roleId"),
    permissionId: formData.get("permissionId"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await removePermissionFromRole(parsed.data.roleId, parsed.data.permissionId);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function assignRoleToUserAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "roles.assign");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = assignRoleSchema.safeParse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
    businessId: formData.get("businessId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await assignRoleToUser(parsed.data.userId, parsed.data.roleId, parsed.data.businessId);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

import { serialize } from "@/lib/utils";

export async function getPlatformRolesAction() {
  await requireAuth();
  const roles = await prisma.role.findMany({
    where: { scope: "PLATFORM" },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  return roles;
}

export async function getBusinessRolesAction() {
  await requireAuth();
  const roles = await prisma.role.findMany({
    where: { scope: "BUSINESS" },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  return roles;
}

export async function getRolesAction() {
  await requireAuth();
  const roles = await prisma.role.findMany({
    include: {
      _count: { select: { userRoles: true, rolePermissions: true } },
    },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });
  return serialize(roles);
}

export async function removeRoleFromUserAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "roles.assign");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = assignRoleSchema.safeParse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
    businessId: formData.get("businessId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await removeRoleFromUser(parsed.data.userId, parsed.data.roleId, parsed.data.businessId);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}
