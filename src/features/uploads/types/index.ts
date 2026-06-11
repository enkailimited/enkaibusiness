import type { User } from "@/types/models";

export interface UploadWithUser {
  id: string;
  businessId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  fileId: string;
  thumbnailUrl: string | null;
  size: number;
  mimeType: string;
  folder: string | null;
  tags: string | null;
  createdAt: Date;
  uploadedBy: Pick<User, "id" | "firstName" | "lastName" | "avatarUrl">;
}

export interface UploadFilter {
  folder?: string;
  mimeType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string;
}

export interface ImageUploadResult {
  fileId: string;
  fileUrl: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  fileName: string;
}
