"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createLocationSchema,
  updateLocationSchema,
  updateBalanceSchema,
  transferSchema,
} from "../schemas";
import {
  createLocation,
  updateLocation,
  getLocation,
  getBusinessLocations,
  deleteLocation,
} from "../services/location-service";
import {
  updateBalance,
  getBalancesByLocation,
  transferStock,
  adjustStock,
} from "../services/balance-service";
import type { ActionResponse } from "@/types/relationships";

export async function createLocationAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createLocationSchema.safeParse({
    businessId: formData.get("businessId"),
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createLocation(parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${parsed.data.businessId}/inventory`);
  }

  return result;
}

export async function updateLocationAction(
  locationId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateLocationSchema.safeParse({
    name: formData.get("name") || undefined,
    isActive:
      formData.get("isActive") === "true"
        ? true
        : formData.get("isActive") === "false"
          ? false
          : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const location = await getLocation(locationId);
  if (!location) {
    return { success: false, message: "Location not found" };
  }

  const result = await updateLocation(locationId, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${location.businessId}/inventory`);
  }

  return result;
}

export async function deleteLocationAction(
  locationId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await deleteLocation(locationId);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/inventory`);
  }

  return result;
}

export async function updateBalanceAction(
  balanceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateBalanceSchema.safeParse({
    quantityOnHand: formData.get("quantityOnHand") || undefined,
    quantityAvailable: formData.get("quantityAvailable") || undefined,
    quantityCommitted: formData.get("quantityCommitted") || undefined,
    reorderPoint: formData.get("reorderPoint") || undefined,
    maxStock: formData.get("maxStock") || undefined,
    batchNo: formData.get("batchNo") || undefined,
    expiryDate: formData.get("expiryDate") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return updateBalance(balanceId, parsed.data);
}

export async function transferStockAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = transferSchema.safeParse({
    fromLocationId: formData.get("fromLocationId"),
    toLocationId: formData.get("toLocationId"),
    catalogItemId: formData.get("catalogItemId"),
    variantId: formData.get("variantId") || undefined,
    quantity: formData.get("quantity"),
    notes: formData.get("notes") || undefined,
    createdById: formData.get("createdById") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await transferStock(parsed.data);

  if (result.success) {
    const location = await getLocation(parsed.data.fromLocationId);
    if (location) {
      revalidatePath(`/businesses/${location.businessId}/inventory`);
    }
  }

  return result;
}

export async function adjustStockAction(
  locationId: string,
  catalogItemId: string,
  newQuantity: number,
  businessId: string,
  variantId?: string,
  notes?: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await adjustStock(locationId, catalogItemId, newQuantity, variantId, notes);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/inventory`);
  }

  return result;
}
