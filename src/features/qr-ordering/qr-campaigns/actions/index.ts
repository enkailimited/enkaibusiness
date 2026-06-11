"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
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
  await requireAuth();

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
  await requireAuth();
  const result = await deleteCampaign(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function launchCampaignAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await launchCampaign(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function completeCampaignAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await completeCampaign(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function cancelCampaignAction(id: string): Promise<ActionResponse> {
  await requireAuth();
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
