import { z } from "zod";

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid("Category is required"),
  staffId: z.string().uuid().optional().or(z.literal("")),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  expenseDate: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  paidTo: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "approved", "paid"]).default("draft"),
  branchId: z.string().uuid().optional().or(z.literal("")),
  storeId: z.string().uuid().optional().or(z.literal("")),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  staffId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseSchema = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilterSchema = z.infer<typeof expenseFilterSchema>;
