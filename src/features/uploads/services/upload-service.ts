import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { UploadWithUser, ImageUploadResult, UploadOptions } from "../types";
import type { UploadFilterSchema } from "../schemas";

const uploadInclude = {
  uploadedBy: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
};

function toUploadWithUser(raw: Record<string, unknown>): UploadWithUser {
  return raw as unknown as UploadWithUser;
}

export async function uploadFile(
  data: ImageUploadResult & { businessId: string; uploadedById: string } & UploadOptions,
): Promise<ActionResponse & { data?: UploadWithUser }> {
  try {
    const upload = await prisma.upload.create({
      data: {
        businessId: data.businessId,
        uploadedById: data.uploadedById,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileId: data.fileId,
        thumbnailUrl: data.thumbnailUrl ?? null,
        size: data.size,
        mimeType: data.mimeType,
        folder: data.folder ?? "general",
        tags: data.tags ?? "",
      },
      include: uploadInclude,
    });

    return {
      success: true,
      message: "File uploaded successfully",
      data: toUploadWithUser(upload as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Upload file error:", error);
    return { success: false, message: "Failed to upload file" };
  }
}

export async function getUploads(
  businessId: string,
  filter?: UploadFilterSchema,
): Promise<{ uploads: UploadWithUser[]; total: number }> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.folder) where.folder = filter.folder;
  if (filter?.mimeType) where.mimeType = { startsWith: filter.mimeType.split("/")[0] + "/" };
  if (filter?.search) {
    where.fileName = { contains: filter.search, mode: "insensitive" };
  }
  if (filter?.startDate || filter?.endDate) {
    const createdAt: Record<string, Date> = {};
    if (filter.startDate) createdAt.gte = new Date(filter.startDate);
    if (filter.endDate) createdAt.lte = new Date(filter.endDate);
    where.createdAt = createdAt;
  }

  const page = filter?.page ?? 1;
  const limit = filter?.limit ?? 50;
  const skip = (page - 1) * limit;

  const [uploads, total] = await Promise.all([
    prisma.upload.findMany({
      where,
      include: uploadInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.upload.count({ where }),
  ]);

  return {
    uploads: (uploads as unknown as Record<string, unknown>[]).map(toUploadWithUser),
    total,
  };
}

export async function getUpload(id: string): Promise<UploadWithUser | null> {
  const upload = await prisma.upload.findUnique({
    where: { id },
    include: uploadInclude,
  });

  if (!upload) return null;
  return toUploadWithUser(upload as unknown as Record<string, unknown>);
}

export async function deleteUpload(id: string): Promise<ActionResponse> {
  try {
    await prisma.upload.delete({ where: { id } });
    return { success: true, message: "Upload deleted successfully" };
  } catch (error) {
    console.error("Delete upload error:", error);
    return { success: false, message: "Failed to delete upload" };
  }
}

export async function getUploadsByFolder(
  businessId: string,
  folder: string,
): Promise<UploadWithUser[]> {
  const uploads = await prisma.upload.findMany({
    where: { businessId, folder },
    include: uploadInclude,
    orderBy: { createdAt: "desc" },
  });

  return (uploads as unknown as Record<string, unknown>[]).map(toUploadWithUser);
}
