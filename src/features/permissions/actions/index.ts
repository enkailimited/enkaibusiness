"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createPermission, updatePermission, deletePermission } from "../services/permission-service";
import type { ActionResponse } from "@/types/relationships";

export async function createPermissionAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || undefined,
    module: formData.get("module") as string,
    action: formData.get("action") as string,
  };

  if (!data.name || !data.slug || !data.module || !data.action) {
    return { success: false, message: "Missing required fields" };
  }

  const result = await createPermission(data);

  if (result.success) revalidatePath("/platform/permissions");

  return result;
}

export async function updatePermissionAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Record<string, string | undefined> = {
    name: (formData.get("name") as string) || undefined,
    slug: (formData.get("slug") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    module: (formData.get("module") as string) || undefined,
    action: (formData.get("action") as string) || undefined,
  };

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ""),
  );

  const result = await updatePermission(id, cleaned);

  if (result.success) revalidatePath("/platform/permissions");

  return result;
}

export async function deletePermissionAction(
  id: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await deletePermission(id);

  if (result.success) revalidatePath("/platform/permissions");

  return result;
}
