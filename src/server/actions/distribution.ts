"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  generateQRCodes,
  assignQRCodes,
  getQRCodes,
  installQRCode,
  getDistributionMetrics,
} from "@/server/services/distribution-service";
import {
  createCampaignSchema,
  updateCampaignSchema,
  assignQRCodeSchema,
  installQRCodeSchema,
} from "@/lib/validations/distribution";
import type { ActionResponse } from "@/types/relationships";

export async function createCampaignAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createCampaignSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
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
    revalidatePath("/distribution");
  }

  return result;
}

export async function getCampaignsAction() {
  await requireAuth();
  return getCampaigns();
}

export async function getCampaignAction(id: string) {
  await requireAuth();
  return getCampaign(id);
}

export async function updateCampaignAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateCampaignSchema.safeParse({
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    totalQRCodes: formData.get("totalQRCodes") ? Number(formData.get("totalQRCodes")) : undefined,
    status: formData.get("status") || undefined,
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

  const result = await updateCampaign(id, {
    ...parsed.data,
    status: (formData.get("status") as string) || undefined,
  });

  if (result.success) {
    revalidatePath("/distribution");
  }

  return result;
}

export async function generateQRCodesAction(
  campaignId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const count = Number(formData.get("count")) || 0;

  if (count < 1) {
    return { success: false, message: "Count must be at least 1" };
  }

  const result = await generateQRCodes(campaignId, count);

  if (result.success) {
    revalidatePath("/distribution");
  }

  return result;
}

export async function assignQRCodesAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = assignQRCodeSchema.safeParse({
    qrCodeIds: JSON.parse((formData.get("qrCodeIds") as string) || "[]"),
    assignedTo: formData.get("assignedTo"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await assignQRCodes(parsed.data, user.id);

  if (result.success) {
    revalidatePath("/distribution");
  }

  return result;
}

export async function getQRCodesAction(filters?: {
  campaignId?: string;
  status?: string;
  businessId?: string;
  assignedToId?: string;
}) {
  await requireAuth();
  return getQRCodes(filters);
}

export async function installQRCodeAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = installQRCodeSchema.safeParse({
    qrCodeId: formData.get("qrCodeId"),
    businessId: formData.get("businessId"),
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await installQRCode(parsed.data, user.id);

  if (result.success) {
    revalidatePath("/distribution");
  }

  return result;
}

export async function getDistributionMetricsAction() {
  await requireAuth();
  return getDistributionMetrics();
}
