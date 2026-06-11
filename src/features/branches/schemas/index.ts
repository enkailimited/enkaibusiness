import { z } from "zod";

export const createBranchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .max(200, "Branch name is too long"),
  code: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  country: z.string().default("Tanzania"),
  postalCode: z.string().optional().or(z.literal("")),
  isHeadOffice: z.boolean().default(false),
  openingTime: z.string().optional().or(z.literal("")),
  closingTime: z.string().optional().or(z.literal("")),
});

export const updateBranchSchema = createBranchSchema.partial();

export type CreateBranchSchema = z.infer<typeof createBranchSchema>;
export type UpdateBranchSchema = z.infer<typeof updateBranchSchema>;
