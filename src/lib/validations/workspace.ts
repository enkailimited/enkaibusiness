import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z
    .string()
    .max(500, "Description is too long")
    .optional()
    .or(z.literal("")),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "GUEST"]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "GUEST"]),
});

export type CreateWorkspaceSchema = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceSchema = z.infer<typeof updateWorkspaceSchema>;
export type AddMemberSchema = z.infer<typeof addMemberSchema>;
