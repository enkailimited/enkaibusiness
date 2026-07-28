"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  uploadFile,
  getUploads,
  getUpload,
  deleteUpload,
  getUploadsByFolder,
} from "../services/upload-service";
import { uploadFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import type { UploadWithUser, ImageUploadResult, UploadOptions } from "../types";

export async function uploadFileAction(
  data: ImageUploadResult & { businessId: string } & UploadOptions,
): Promise<ActionResponse & { data?: UploadWithUser }> {
  const user = await requireAuth();

  const can = await hasPermission(user.id, "uploads.create", data.businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await uploadFile({
    ...data,
    uploadedById: user.id,
  });

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${data.businessId}/commerce/uploads`);
  }

  return result;
}

export async function getUploadsAction(
  businessId: string,
  filter?: Record<string, unknown>,
): Promise<{ uploads: UploadWithUser[]; total: number }> {
  await requireAuth();

  const parsed = filter
    ? uploadFilterSchema.safeParse(filter)
    : { success: true, data: undefined };

  return getUploads(businessId, parsed.success ? parsed.data : undefined);
}

export async function getUploadAction(id: string): Promise<UploadWithUser | null> {
  await requireAuth();
  return getUpload(id);
}

export async function deleteUploadAction(
  id: string,
  businessId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const can = await hasPermission(user.id, "uploads.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

  const result = await deleteUpload(id);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/uploads`);
  }

  return result;
}

export async function getUploadsByFolderAction(
  businessId: string,
  folder: string,
): Promise<UploadWithUser[]> {
  await requireAuth();
  return getUploadsByFolder(businessId, folder);
}
