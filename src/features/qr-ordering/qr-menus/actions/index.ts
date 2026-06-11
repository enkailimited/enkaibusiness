"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createMenuItem,
  updateMenuItem,
  getMenuItem,
  listMenuItems,
  deleteMenuItem,
  setMenuItemAvailability,
} from "../services/menu-service";
import { createMenuItemSchema, updateMenuItemSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createMenuItemAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createMenuItemSchema.safeParse({
    businessId: formData.get("businessId"),
    qrCodeId: formData.get("qrCodeId"),
    catalogItemId: formData.get("catalogItemId"),
    isAvailable: formData.get("isAvailable") === "true",
    sortOrder: Number(formData.get("sortOrder")) || 0,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createMenuItem(parsed.data);

  if (result.success) {
    revalidatePath("/qr-ordering");
  }

  return result;
}

export async function updateMenuItemAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateMenuItemSchema.safeParse({
    isAvailable: formData.has("isAvailable")
      ? formData.get("isAvailable") === "true"
      : undefined,
    sortOrder: formData.get("sortOrder")
      ? Number(formData.get("sortOrder"))
      : undefined,
    price: formData.get("price")
      ? Number(formData.get("price"))
      : formData.get("clearPrice") === "true"
        ? null
        : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateMenuItem(id, parsed.data);

  if (result.success) {
    revalidatePath("/qr-ordering");
  }

  return result;
}

export async function getMenuItemAction(id: string) {
  await requireAuth();
  return getMenuItem(id);
}

export async function listMenuItemsAction(qrCodeId: string) {
  await requireAuth();
  return listMenuItems(qrCodeId);
}

export async function deleteMenuItemAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await deleteMenuItem(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function setMenuItemAvailabilityAction(
  id: string,
  isAvailable: boolean,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await setMenuItemAvailability(id, isAvailable);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}
