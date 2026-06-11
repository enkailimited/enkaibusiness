"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createQRCodes,
  getQRCode,
  listQRCodes,
  updateQRCode,
  deleteQRCode,
  assignQRCode,
  installQRCode,
} from "../services/qr-code-service";
import {
  createQRCodeSchema,
  assignQRCodeSchema,
  installQRCodeSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import type { QRCodeFilterSchema } from "../schemas";

export async function createQRCodesAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createQRCodeSchema.safeParse({
    campaignId: formData.get("campaignId"),
    count: Number(formData.get("count")) || 1,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createQRCodes(parsed.data);

  if (result.success) {
    revalidatePath("/qr-ordering");
  }

  return result;
}

export async function getQRCodeAction(id: string) {
  await requireAuth();
  return getQRCode(id);
}

export async function listQRCodesAction(filters?: QRCodeFilterSchema) {
  await requireAuth();
  return listQRCodes(filters);
}

export async function updateQRCodeAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const status = formData.get("status") as string | null;

  const result = await updateQRCode(id, {
    status: status as any,
    businessId: (formData.get("businessId") as string) || undefined,
  });

  if (result.success) {
    revalidatePath("/qr-ordering");
  }

  return result;
}

export async function deleteQRCodeAction(
  id: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await deleteQRCode(id);
  if (result.success) {
    revalidatePath("/qr-ordering");
  }
  return result;
}

export async function assignQRCodeAction(
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

  const result = await assignQRCode(parsed.data, user.id);

  if (result.success) {
    revalidatePath("/qr-ordering");
  }

  return result;
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
    revalidatePath("/qr-ordering");
  }

  return result;
}
