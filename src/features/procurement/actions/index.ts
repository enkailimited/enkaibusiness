"use server";

import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { isAdvancedProcurement, setAdvancedProcurement } from "../services/procurement-service";

export async function getAdvancedProcurementAction(businessId: string): Promise<boolean> {
  await requireAuth();
  return isAdvancedProcurement(businessId);
}

export async function setAdvancedProcurementAction(
  businessId: string,
  enabled: boolean,
): Promise<{ success: boolean; message?: string }> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "procurement.update", businessId);
  if (!can) return { success: false, message: "You do not have permission to update procurement settings" };
  await setAdvancedProcurement(businessId, enabled);
  return { success: true };
}
