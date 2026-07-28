"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  createCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
  deleteCampaign,
  launchCampaign,
  completeCampaign,
  cancelCampaign,
  getCampaignMetrics,
} from "../services/campaign-service";
import { createCampaignSchema, updateCampaignSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import type { CampaignFilterSchema } from "../schemas";

export async function createCampaignAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canCreate = await hasPermission(user.id, "qr.create");
  if (!canCreate) {
    return { success: false, message: "You do not have permission to create campaigns" };
  }

  const parsed = createCampaignSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    totalQRCodes: Number(formData.get("totalQRCodes")) || 0,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createCampaign(parsed.data, user.id);

  if (result.success) {
    revalidatePath("/qr-ordering");
  }

  return result;
}

export async function getCampaignAction(id: string) {
  await requireAuth();
  return getCampaign(id);
}

export async function listCampaignsAction(filters?: CampaignFilterSchema) {
  await requireAuth();
  return listCampaigns(filters);
}

export async function updateCampaignAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canUpdate = await hasPermission(user.id, "qr.update");
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to update campaigns" };
  }

  const parsed = updateCampaignSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    totalQRCodes: formData.get("totalQRCodes") ? Number(formData.get("totalQRCodes")) : undefined,
    status: (formData.get("status") as string) || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateCampaign(id, parsed.data);

  if (result.success) {
    revalidatePath("/qr-ordering");
  }

  return result;
}

export async function deleteCampaignAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();

  const canDelete = await hasPermission(user.id, "qr.delete");
  if (!canDelete) {
    return { success: false, message: "You do not have permission to delete campaigns" };
  }

  const result = await deleteCampaign(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function launchCampaignAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();

  const canUpdate = await hasPermission(user.id, "qr.update");
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to launch campaigns" };
  }

  const result = await launchCampaign(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function completeCampaignAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();

  const canUpdate = await hasPermission(user.id, "qr.update");
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to complete campaigns" };
  }

  const result = await completeCampaign(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function cancelCampaignAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();

  const canUpdate = await hasPermission(user.id, "qr.update");
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to cancel campaigns" };
  }

  const result = await cancelCampaign(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function getCampaignMetricsAction() {
  await requireAuth();
  return getCampaignMetrics();
}
