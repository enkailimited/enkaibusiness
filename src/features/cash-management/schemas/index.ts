import { z } from "zod";
import { DEFAULT_PAGE_SIZE } from "../constants";

export const createRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["main", "petty_cash", "till"]),
  currency: z.string().default("TZS"),
  openingBalance: z.coerce.number().min(0).default(0),
  branchId: z.string().uuid().optional().or(z.literal("")),
  storeId: z.string().uuid().optional().or(z.literal("")),
});

export const updateRegisterSchema = createRegisterSchema.partial();

export const createTransactionSchema = z.object({
  registerId: z.string().uuid("Register is required"),
  type: z.enum([
    "cash_in",
    "cash_out",
    "transfer_in",
    "transfer_out",
    "opening_balance",
    "closing_balance",
    "cash_count",
  ]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  reference: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export const registerFilterSchema = z.object({
  type: z.string().optional(),
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const transactionFilterSchema = z.object({
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
});

export type CreateRegisterSchema = z.infer<typeof createRegisterSchema>;
export type UpdateRegisterSchema = z.infer<typeof updateRegisterSchema>;
export type CreateTransactionSchema = z.infer<typeof createTransactionSchema>;
export type RegisterFilterSchema = z.infer<typeof registerFilterSchema>;
export type TransactionFilterSchema = z.infer<typeof transactionFilterSchema>;
