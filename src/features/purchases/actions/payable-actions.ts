"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getBusinessOutstandingSuppliers,
  getEnhancedPayablesSummary,
  getPayablesAging,
  getOutstandingPurchases,
  getOverduePurchases,
  getRecentSupplierPayments,
  recordPurchasePayment,
} from "../services/payable-service";
import type { ActionResponse } from "@/types/relationships";

export async function getPayablesSummaryAction(businessId: string) {
  await requireAuth();
  return getEnhancedPayablesSummary(businessId);
}

export async function getOutstandingSuppliersAction(businessId: string) {
  await requireAuth();
  return getBusinessOutstandingSuppliers(businessId);
}

export async function getPayablesAgingAction(businessId: string) {
  await requireAuth();
  return getPayablesAging(businessId);
}

export async function getOutstandingPurchasesAction(businessId: string) {
  await requireAuth();
  return getOutstandingPurchases(businessId);
}

export async function getOverduePurchasesAction(businessId: string) {
  await requireAuth();
  return getOverduePurchases(businessId);
}

export async function getRecentSupplierPaymentsAction(businessId: string) {
  await requireAuth();
  return getRecentSupplierPayments(businessId);
}

export async function recordPurchasePaymentAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const purchaseId = formData.get("purchaseId") as string;
  const amount = parseFloat(formData.get("amount") as string) || 0;
  const businessId = formData.get("businessId") as string;
  const workspaceId = formData.get("workspaceId") as string || undefined;
  const paymentMethodId = formData.get("paymentMethodId") as string || undefined;
  const notes = formData.get("notes") as string || undefined;

  if (!purchaseId || amount <= 0) {
    return { success: false, message: "Purchase ID and positive amount are required" };
  }

  const result = await recordPurchasePayment(
    purchaseId,
    amount,
    businessId,
    workspaceId,
    paymentMethodId,
    user.id,
    notes,
  );

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}`);
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/payables`);
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/purchases`);
  }

  return result;
}
