"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { getBranch } from "@/features/branches/services/branch-service";
import {
  createStore,
  updateStore,
  getStore,
  getBranchStores,
  deleteStore,
} from "../services/store-service";
import { createStoreSchema, updateStoreSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createStoreAction(
  branchId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const branch = await getBranch(branchId);
  if (!branch) return { success: false, message: "Branch not found" };
  const can = await hasPermission(user.id, "stores.create", branch.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

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

export async function updateStoreAction(
  storeId: string,
  branchId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const branch = await getBranch(branchId);
  if (!branch) return { success: false, message: "Branch not found" };
  const can = await hasPermission(user.id, "stores.update", branch.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const parsed = updateStoreSchema.safeParse({
    name: formData.get("name") || undefined,
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

  const result = await updateStore(storeId, parsed.data);

  if (result.success) {
    revalidatePath(`/branches/${branchId}/stores`);
  }

  return result;
}

export async function getStoreAction(id: string) {
  await requireAuth();
  return getStore(id);
}

export async function getBranchStoresAction(branchId: string) {
  await requireAuth();
  return getBranchStores(branchId);
}

export async function deleteStoreAction(branchId: string, storeId: string) {
  const user = await requireAuth();

  const branch = await getBranch(branchId);
  if (!branch) return { success: false, message: "Branch not found" };
  const can = await hasPermission(user.id, "stores.delete", branch.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await deleteStore(storeId);
  if (result.success) {
    revalidatePath(`/branches/${branchId}/stores`);
  }
  return result;
}
