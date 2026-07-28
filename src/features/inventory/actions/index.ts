"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { hasPermission } from "@/features/roles/services/assignment-service";
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
//   getBusinessLocations,
  deleteLocation,
} from "../services/location-service";
import {
  updateBalance,
//   getBalancesByLocation,
  transferStock,
  adjustStock,
} from "../services/balance-service";
import type { ActionResponse } from "@/types/relationships";

export async function createLocationAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

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

  const can = await hasPermission(user.id, "inventory.create", parsed.data.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await createLocation(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${parsed.data.businessId}/commerce/inventory`);
  }

  return result;
}

export async function updateLocationAction(
  locationId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

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

  const can = await hasPermission(user.id, "inventory.update", location.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await updateLocation(locationId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${location.businessId}/commerce/inventory`);
  }

  return result;
}

export async function deleteLocationAction(
  locationId: string,
  businessId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "inventory.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await deleteLocation(locationId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/inventory`);
  }

  return result;
}

export async function updateBalanceAction(
  balanceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const balance = await prisma.inventoryBalance.findUnique({
    where: { id: balanceId },
    include: { location: true },
  });
  if (!balance) return { success: false, message: "Balance not found" };
  const can = await hasPermission(user.id, "inventory.update", balance.location.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

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
  const user = await requireAuth();

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

  const fromLocation = await getLocation(parsed.data.fromLocationId);
  if (!fromLocation) return { success: false, message: "Source location not found" };
  const can = await hasPermission(user.id, "inventory.transfer", fromLocation.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await transferStock(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${fromLocation.businessId}/commerce/inventory`);
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
  const user = await requireAuth();
  const can = await hasPermission(user.id, "inventory.adjust", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await adjustStock(locationId, catalogItemId, newQuantity, variantId, notes);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/inventory`);
  }

  return result;
}
