"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createUnit, updateUnit, deleteUnit } from "../services/unit-service";
import { createUnitSchema, updateUnitSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createUnitAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

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
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}

export async function updateUnitAction(
  unitId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

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
    const unit = await import("../services/unit-service").then((m) => m.getUnit(unitId));
    if (unit) {
      revalidatePath(`/businesses/${unit.businessId}/catalog`);
    }
  }

  return result;
}

export async function deleteUnitAction(
  businessId: string,
  unitId: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await deleteUnit(unitId);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/catalog`);
  }

  return result;
}
