"use server";

import { requireAuth } from "@/server/auth";
import { isAdvancedProcurement, setAdvancedProcurement } from "../services/procurement-service";

export async function getAdvancedProcurementAction(businessId: string): Promise<boolean> {
  await requireAuth();
  return isAdvancedProcurement(businessId);
}

export async function setAdvancedProcurementAction(
  businessId: string,
  enabled: boolean,
): Promise<{ success: boolean }> {
  await requireAuth();
  await setAdvancedProcurement(businessId, enabled);
  return { success: true };
}
