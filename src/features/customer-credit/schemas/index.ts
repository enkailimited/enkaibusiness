import { z } from "zod";

export const creditAccountStatusEnum = z.enum(["active", "frozen", "closed"]);
export const creditTransactionTypeEnum = z.enum([
  "credit_sale",
  "payment",
  "adjustment",
  "write_off",
  "refund",
]);

export const createAccountSchema = z.object({
  customerId: z.string().uuid("Invalid customer"),
  creditLimit: z.coerce.number().min(0, "Credit limit must be 0 or greater"),
});

export const updateAccountSchema = z.object({
  creditLimit: z.coerce.number().min(0).optional(),
  status: creditAccountStatusEnum.optional(),
});

export const creditTransactionSchema = z.object({
  accountId: z.string().uuid("Invalid account"),
  type: creditTransactionTypeEnum,
  amount: z.coerce.number(),
  description: z.string().max(500).optional().or(z.literal("")),
  reference: z.string().max(100).optional().or(z.literal("")),
});

export const accountFilterSchema = z.object({
  status: creditAccountStatusEnum.optional(),
  customerId: z.string().uuid().optional(),
});

export const transactionFilterSchema = z.object({
  type: creditTransactionTypeEnum.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type CreateAccountSchema = z.infer<typeof createAccountSchema>;
export type UpdateAccountSchema = z.infer<typeof updateAccountSchema>;
export type CreditTransactionSchema = z.infer<typeof creditTransactionSchema>;
export type AccountFilterSchema = z.infer<typeof accountFilterSchema>;
export type TransactionFilterSchema = z.infer<typeof transactionFilterSchema>;
