"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  createPaymentSchema,
  paymentFilterSchema,
} from "../schemas";
import {
  createPaymentMethod,
  updatePaymentMethod,
  getBusinessPaymentMethods,
  getPaymentMethod,
  deletePaymentMethod,
} from "../services/payment-method-service";
import {
  createPayment,
  listPayments,
  getPayment,
  voidPayment,
} from "../services/payment-service";
import type { ActionResponse } from "@/types/relationships";

export async function createPaymentMethodAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createPaymentMethodSchema.safeParse({
    businessId: formData.get("businessId"),
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createPaymentMethod(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${parsed.data.businessId}/payments`);
  }

  return result;
}

export async function updatePaymentMethodAction(
  methodId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updatePaymentMethodSchema.safeParse({
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
    isActive: formData.get("isActive") === "true" ? true : formData.get("isActive") === "false" ? false : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const method = await getPaymentMethod(methodId);
  if (!method) {
    return { success: false, message: "Payment method not found" };
  }

  const result = await updatePaymentMethod(methodId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${method.businessId}/payments`);
  }

  return result;
}

export async function deletePaymentMethodAction(
  methodId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await deletePaymentMethod(methodId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/payments`);
  }

  return result;
}

export async function createPaymentAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createPaymentSchema.safeParse({
    businessId: formData.get("businessId"),
    workspaceId: formData.get("workspaceId") || undefined,
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    paymentMethodId: formData.get("paymentMethodId") || undefined,
    customerId: formData.get("customerId") || undefined,
    amount: formData.get("amount"),
    reference: formData.get("reference") || undefined,
    paidAt: formData.get("paidAt") || undefined,
    status: formData.get("status") || "completed",
    notes: formData.get("notes") || undefined,
    saleId: formData.get("saleId") || undefined,
    invoiceId: formData.get("invoiceId") || undefined,
    customerCreditTxId: formData.get("customerCreditTxId") || undefined,
    subscriptionId: formData.get("subscriptionId") || undefined,
    purchaseId: formData.get("purchaseId") || undefined,
    expenseId: formData.get("expenseId") || undefined,
    createdById: formData.get("createdById") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createPayment(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${parsed.data.businessId}/payments`);
  }

  return result;
}

export async function listPaymentsAction(
  filter: Record<string, unknown>,
): Promise<PaymentListResponse> {
  await requireAuth();

  const parsed = paymentFilterSchema.safeParse(filter);

  if (!parsed.success) {
    return { success: false, message: "Invalid filter", payments: [] };
  }

  const payments = await listPayments(parsed.data);

  return { success: true, message: "", payments };
}

interface PaymentListResponse {
  success: boolean;
  message: string;
  payments: Awaited<ReturnType<typeof listPayments>>;
}

export async function voidPaymentAction(
  paymentId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await voidPayment(paymentId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/payments`);
  }

  return result;
}
