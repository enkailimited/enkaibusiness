"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createRole } from "@/server/services/rbac-service";
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
