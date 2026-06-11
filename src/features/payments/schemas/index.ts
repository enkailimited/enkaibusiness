import { z } from "zod";
import { PAYMENT_METHOD_TYPES, PAYMENT_STATUSES, PAYMENT_REFERENCE_TYPES } from "../constants";

const referenceTypeValues = PAYMENT_REFERENCE_TYPES.map((r) => r.value) as [string, ...string[]];

export const createPaymentMethodSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  type: z.enum(PAYMENT_METHOD_TYPES, {
    errorMap: () => ({ message: "Type must be cash, card, mobile, bank, or credit" }),
  }),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  type: z.enum(PAYMENT_METHOD_TYPES).optional(),
  isActive: z.boolean().optional(),
});

const createPaymentSchemaBase = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  workspaceId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  reference: z.string().max(100).optional(),
  paidAt: z.string().optional(),
  status: z.enum(PAYMENT_STATUSES).default("completed"),
  notes: z.string().optional(),
  saleId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  customerCreditTxId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  purchaseId: z.string().uuid().optional(),
  expenseId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
});

export const createPaymentSchema = createPaymentSchemaBase.superRefine((data, ctx) => {
  const refs = [
    data.saleId,
    data.invoiceId,
    data.customerCreditTxId,
    data.subscriptionId,
    data.purchaseId,
    data.expenseId,
  ].filter(Boolean);

  if (refs.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At most one polymorphic reference (saleId, invoiceId, etc.) can be set",
      path: ["saleId"],
    });
  }
});

export const paymentFilterSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  referenceType: z.enum(referenceTypeValues).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customerId: z.string().uuid().optional(),
});

export type CreatePaymentMethodSchema = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodSchema = z.infer<typeof updatePaymentMethodSchema>;
export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;
export type PaymentFilterSchema = z.infer<typeof paymentFilterSchema>;
