"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createStore, deleteStore } from "@/server/services/store-service";
import { createStoreSchema } from "@/lib/validations/store";
import type { ActionResponse } from "@/types/relationships";

export async function createStoreAction(
  branchId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createStoreSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createStore(branchId, parsed.data);

  if (result.success) {
    revalidatePath(`/branches/${branchId}/stores`);
  }

  return result;
}

export async function deleteStoreAction(branchId: string, storeId: string) {
  await requireAuth();
  const result = await deleteStore(storeId);

  if (result.success) {
    revalidatePath(`/branches/${branchId}/stores`);
  }

  return result;
}
