import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(255).optional().or(z.literal("")),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  isDefault: z.coerce.boolean().default(false),
});

export const updateGroupSchema = createGroupSchema.partial();

export type CreateGroupSchema = z.infer<typeof createGroupSchema>;
export type UpdateGroupSchema = z.infer<typeof updateGroupSchema>;
