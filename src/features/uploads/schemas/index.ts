import { z } from "zod";
import { DEFAULT_FOLDERS, ALLOWED_MIME_TYPES } from "../constants";

const allowedMimeTypes = ALLOWED_MIME_TYPES as unknown as [string, ...string[]];

export const uploadFilterSchema = z.object({
  folder: z.enum(DEFAULT_FOLDERS as unknown as [string, ...string[]]).optional(),
  mimeType: z.enum(allowedMimeTypes).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type UploadFilterSchema = z.infer<typeof uploadFilterSchema>;
