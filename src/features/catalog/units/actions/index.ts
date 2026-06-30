"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { createUnit, updateUnit, deleteUnit, getBusinessUnits, getUnit } from "../services/unit-service";
import { createUnitSchema, updateUnitSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createUnitAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canCreate = await hasPermission(user.id, "catalog.create", businessId);
  if (!canCreate) {
    return { success: false, message: "You do not have permission to create units" };
  }

  const parsed = createUnitSchema.safeParse({
    name: formData.get("name"),
    abbreviation: formData.get("abbreviation"),
    type: formData.get("type"),
    isBase: formData.get("isBase") === "true" || formData.get("isBase") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createUnit(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog`);
  }

  return result;
}

export async function updateUnitAction(
  unitId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const existing = await getUnit(unitId);
  if (!existing) {
    return { success: false, message: "Unit not found" };
  }

  const canUpdate = await hasPermission(user.id, "catalog.update", existing.businessId);
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to update units" };
  }

  const parsed = updateUnitSchema.safeParse({
    name: formData.get("name") || undefined,
    abbreviation: formData.get("abbreviation") || undefined,
    type: formData.get("type") || undefined,
    isBase: formData.get("isBase") === "true" || formData.get("isBase") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateUnit(unitId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${existing.businessId}/commerce/catalog`);
  }

  return result;
}

export async function listUnitsAction(businessId: string) {
  const user = await requireAuth();
  const canList = await hasPermission(user.id, "catalog.list", businessId);
  if (!canList) {
    return [];
  }
  return getBusinessUnits(businessId);
}

export async function deleteUnitAction(
  businessId: string,
  unitId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const canDelete = await hasPermission(user.id, "catalog.delete", businessId);
  if (!canDelete) {
    return { success: false, message: "You do not have permission to delete units" };
  }
  const result = await deleteUnit(unitId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog`);
  }

  return result;
}
