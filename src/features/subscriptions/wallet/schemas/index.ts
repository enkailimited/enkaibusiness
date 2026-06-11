import { z } from "zod";

const walletTransactionTypeEnum = z.enum([
  "deposit",
  "consumption",
  "bonus",
  "adjustment",
  "refund",
  "expiry",
]);

export const createWalletTransactionSchema = z.object({
  type: walletTransactionTypeEnum,
  amount: z.coerce.number().positive("Amount must be positive"),
  reference: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  expiresAt: z.string().datetime().optional(),
});

export type CreateWalletTransactionSchema = z.infer<
  typeof createWalletTransactionSchema
>;
