import { z } from "zod";

export const createDepositRequestSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  reference: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export type CreateDepositRequestSchema = z.infer<typeof createDepositRequestSchema>;
