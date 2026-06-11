"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { movementFilterSchema } from "../schemas";
import {
  getMovementsByLocation,
  getMovementsByItem,
  getMovementsByReference,
  getInventorySummary,
} from "../services/stock-service";
import type { MovementWithDetails, InventorySummary } from "../types";

export async function getLocationMovementsAction(
  locationId: string,
  filter?: Record<string, unknown>,
): Promise<{ success: boolean; movements: MovementWithDetails[]; total: number }> {
  await requireAuth();

  const parsed = filter ? movementFilterSchema.partial().safeParse(filter) : { success: true, data: undefined };
  const result = await getMovementsByLocation(locationId, parsed.success ? parsed.data : undefined);

  return { success: true, movements: result.movements, total: result.total };
}

export async function getItemMovementsAction(
  catalogItemId: string,
): Promise<{ success: boolean; movements: MovementWithDetails[] }> {
  await requireAuth();

  const movements = await getMovementsByItem(catalogItemId);

  return { success: true, movements };
}

export async function getMovementsByReferenceAction(
  referenceType: string,
  reference?: string,
): Promise<{ success: boolean; movements: MovementWithDetails[] }> {
  await requireAuth();

  const movements = await getMovementsByReference(referenceType, reference);

  return { success: true, movements };
}

export async function getInventorySummaryAction(
  businessId: string,
): Promise<{ success: boolean; summary: InventorySummary }> {
  await requireAuth();

  const summary = await getInventorySummary(businessId);

  return { success: true, summary };
}
