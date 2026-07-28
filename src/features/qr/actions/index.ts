"use server";

import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { createQRExperience, updateQRStatus, recordQRScan } from "../services/qr-service";

export async function createQRExperienceAction(_prev: unknown, formData: FormData) {
  try {
    const user = await requireAuth();
    const businessId = formData.get("businessId") as string;
    const can = await hasPermission(user.id, "qr.create", businessId);
    if (!can) return { success: false, message: "You do not have permission" };
    const branchId = (formData.get("branchId") as string) || undefined;
    const mode = formData.get("mode") as string;
    const label = (formData.get("label") as string) || undefined;
    const destinationUrl = (formData.get("destinationUrl") as string) || undefined;

    if (!businessId || !mode) return { success: false, message: "Business and mode are required" };

    const experience = await createQRExperience({ businessId, branchId, mode: mode as any, label, destinationUrl });
    return { success: true, message: "QR Experience created", data: { id: experience.id, code: experience.code } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create QR experience" };
  }
}

export async function activateQRExperienceAction(experienceId: string) {
  try {
    const user = await requireAuth();
    const can = await hasPermission(user.id, "qr.update");
    if (!can) return { success: false, message: "You do not have permission" };
    await updateQRStatus(experienceId, "ACTIVE");
    return { success: true, message: "QR Experience activated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to activate" };
  }
}

export async function deactivateQRExperienceAction(experienceId: string) {
  try {
    const user = await requireAuth();
    const can = await hasPermission(user.id, "qr.update");
    if (!can) return { success: false, message: "You do not have permission" };
    await updateQRStatus(experienceId, "INACTIVE");
    return { success: true, message: "QR Experience deactivated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to deactivate" };
  }
}

export async function recordQRScanAction(experienceId: string) {
  try {
    const user = await requireAuth();
    const can = await hasPermission(user.id, "qr.update");
    if (!can) return { success: false, message: "You do not have permission" };
    await recordQRScan(experienceId);
    return { success: true };
  } catch {
    return { success: false };
  }
}
