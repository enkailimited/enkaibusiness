"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createPermission, updatePermission, deletePermission } from "../services/permission-service";
import type { ActionResponse } from "@/types/relationships";
import { createPermissionSchema, updatePermissionSchema } from "../schemas";
import { hasPermission } from "@/features/roles/services/assignment-service";

export async function createPermissionAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "permissions.create");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = createPermissionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    module: formData.get("module"),
    action: formData.get("action"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await createPermission(parsed.data);

  if (result.success) revalidatePath("/platform/permissions");

  return result;
}

export async function updatePermissionAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "permissions.update");
  if (!can) return { success: false, message: "Unauthorized" };

  const parsed = updatePermissionSchema.safeParse({
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    module: formData.get("module") || undefined,
    action: formData.get("action") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const result = await updatePermission(id, parsed.data);

  if (result.success) revalidatePath("/platform/permissions");

  return result;
}

export async function deletePermissionAction(
  id: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "permissions.delete");
  if (!can) return { success: false, message: "Unauthorized" };

  const result = await deletePermission(id);

  if (result.success) revalidatePath("/platform/permissions");

  return result;
}
