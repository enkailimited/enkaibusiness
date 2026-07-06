import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long")
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long")
    .optional(),
  phone: z
    .string()
    .regex(phoneRegex, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
  nida: z
    .string()
    .max(30, "NIDA number too long")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .min(1, "Physical address is required")
    .max(200, "Address is too long")
    .optional(),
  guarantor: z
    .object({
      fullName: z.string().min(1, "Guarantor name is required").max(100),
      phone: z.string().min(1, "Guarantor phone is required"),
      relationship: z.string().min(1, "Relationship is required").max(50),
      address: z.string().min(1, "Guarantor address is required").max(200),
    })
    .optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
