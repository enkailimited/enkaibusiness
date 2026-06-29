"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getCustomerOutstandingBalance,
  getCustomerOutstandingInvoices,
  getBusinessOutstandingCustomers,
  getBusinessReceivablesSummary,
  getReceivablesAging,
  recordInvoicePayment,
  getOverdueInvoices,
  markOverdueInvoices,
} from "../services/receivable-service";
import type { ActionResponse } from "@/types/relationships";

export async function getCustomerOutstandingBalanceAction(customerId: string): Promise<number> {
  await requireAuth();
  return getCustomerOutstandingBalance(customerId);
}

export async function getCustomerOutstandingInvoicesAction(customerId: string) {
  await requireAuth();
  return getCustomerOutstandingInvoices(customerId);
}

export async function getBusinessOutstandingCustomersAction(businessId: string) {
  await requireAuth();
  return getBusinessOutstandingCustomers(businessId);
}

export async function getBusinessReceivablesSummaryAction(businessId: string) {
  await requireAuth();
  return getBusinessReceivablesSummary(businessId);
}

export async function getReceivablesAgingAction(businessId: string) {
  await requireAuth();
  return getReceivablesAging(businessId);
}

export async function getOverdueInvoicesAction(businessId: string) {
  await requireAuth();
  return getOverdueInvoices(businessId);
}

export async function recordInvoicePaymentAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const invoiceId = formData.get("invoiceId") as string;
  const amount = parseFloat(formData.get("amount") as string) || 0;
  const businessId = formData.get("businessId") as string;
  const workspaceId = formData.get("workspaceId") as string || undefined;
  const paymentMethodId = formData.get("paymentMethodId") as string || undefined;
  const customerId = formData.get("customerId") as string || undefined;
  const notes = formData.get("notes") as string || undefined;

  if (!invoiceId || amount <= 0) {
    return { success: false, message: "Invoice ID and positive amount are required" };
  }

  const result = await recordInvoicePayment(
    invoiceId,
    amount,
    businessId,
    workspaceId,
    paymentMethodId,
    customerId,
    user.id,
    notes,
  );

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}`);
  }

  return result;
}

export async function markOverdueInvoicesAction(businessId: string): Promise<ActionResponse> {
  await requireAuth();
  try {
    const count = await markOverdueInvoices(businessId);
    revalidatePath(`/workspaces/businesses/${businessId}`);
    return { success: true, message: `${count} invoice(s) marked as overdue` };
  } catch (error) {
    return { success: false, message: "Failed to mark overdue invoices" };
  }
}
