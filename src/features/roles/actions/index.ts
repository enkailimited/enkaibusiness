"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createRole, updateRole, deleteRole, assignPermissionToRole, removePermissionFromRole } from "../services/role-service";
import { assignRoleToUser, removeRoleFromUser } from "../services/assignment-service";
import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export async function createRoleAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || undefined,
    scope: formData.get("scope") as "PLATFORM" | "BUSINESS",
    businessId: (formData.get("businessId") as string) || undefined,
  };

  if (!data.name || !data.slug || !data.scope) {
    return { success: false, message: "Missing required fields" };
  }

  const result = await createRole(data);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function updateRoleAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Record<string, string | undefined> = {
    name: (formData.get("name") as string) || undefined,
    slug: (formData.get("slug") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    scope: (formData.get("scope") as string) || undefined,
  };

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ""),
  );

  const result = await updateRole(id, cleaned);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function deleteRoleAction(id: string): Promise<ActionResponse> {
  await requireAuth();

  const result = await deleteRole(id);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function assignPermissionAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const roleId = formData.get("roleId") as string;
  const permissionId = formData.get("permissionId") as string;

  if (!roleId || !permissionId) {
    return { success: false, message: "Missing required fields" };
  }

  const result = await assignPermissionToRole(roleId, permissionId);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function removePermissionAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const roleId = formData.get("roleId") as string;
  const permissionId = formData.get("permissionId") as string;

  if (!roleId || !permissionId) {
    return { success: false, message: "Missing required fields" };
  }

  const result = await removePermissionFromRole(roleId, permissionId);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}

export async function assignRoleToUserAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const userId = formData.get("userId") as string;
  const roleId = formData.get("roleId") as string;
  const businessId = (formData.get("businessId") as string) || undefined;

  if (!userId || !roleId) {
    return { success: false, message: "Missing required fields" };
  }

  const result = await assignRoleToUser(userId, roleId, businessId);

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
  await requireAuth();

  const userId = formData.get("userId") as string;
  const roleId = formData.get("roleId") as string;
  const businessId = (formData.get("businessId") as string) || undefined;

  if (!userId || !roleId) {
    return { success: false, message: "Missing required fields" };
  }

  const result = await removeRoleFromUser(userId, roleId, businessId);

  if (result.success) revalidatePath("/platform/roles");

  return result;
}
