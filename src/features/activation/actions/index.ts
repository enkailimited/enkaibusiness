"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  getActivationInfo,
  getBusinessesPendingActivation,
  submitWalletTopUp,
  approveTopUp,
  rejectTopUp,
  getBusinessesForAdmin,
  suspendBusiness,
  reactivateBusiness,
} from "../services/activation-service";
import type { ActionResponse } from "@/types/relationships";

export async function getActivationInfoAction(businessId: string) {
  await requireAuth();
  return getActivationInfo(businessId);
}

export async function getPendingActivationsAction() {
  const user = await requireAuth();

  const canManage = await hasPermission(user.id, "subscriptions.approve")
    || await hasPermission(user.id, "payments.approve");

  if (!canManage) {
    return { success: false, message: "Unauthorized" } as const;
  }

  return getBusinessesPendingActivation();
}

export async function getBusinessesForAdminAction() {
  const user = await requireAuth();

  const canManage = await hasPermission(user.id, "subscriptions.approve")
    || await hasPermission(user.id, "payments.approve");

  if (!canManage) return [];

  return getBusinessesForAdmin();
}

export async function submitTopUpAction(
  businessId: string,
  amount: number,
  reference: string,
  description?: string,
  paymentProof?: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  return submitWalletTopUp(businessId, user.id, amount, reference, description, paymentProof);
}

export async function approveTopUpAction(
  requestId: string,
  notes?: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canApprove = await hasPermission(user.id, "payments.approve")
    || await hasPermission(user.id, "subscriptions.approve");

  if (!canApprove) {
    return { success: false, message: "You do not have permission to approve payments" };
  }

  const result = await approveTopUp(requestId, user.id, notes);
  if (result.success) {
    revalidatePath("/platform/business-activations");
  }
  return result;
}

export async function rejectTopUpAction(
  requestId: string,
  reason?: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canReject = await hasPermission(user.id, "payments.reject")
    || await hasPermission(user.id, "payments.approve");

  if (!canReject) {
    return { success: false, message: "You do not have permission to reject payments" };
  }

  const result = await rejectTopUp(requestId, user.id, reason);
  if (result.success) {
    revalidatePath("/platform/business-activations");
  }
  return result;
}

export async function suspendBusinessAction(
  businessId: string,
  reason?: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canSuspend = await hasPermission(user.id, "subscriptions.suspend")
    || await hasPermission(user.id, "businesses.update");

  if (!canSuspend) {
    return { success: false, message: "You do not have permission to suspend businesses" };
  }

  const result = await suspendBusiness(businessId, user.id, reason);
  if (result.success) {
    revalidatePath("/platform/business-activations");
  }
  return result;
}

export async function reactivateBusinessAction(
  businessId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canReactivate = await hasPermission(user.id, "subscriptions.activate")
    || await hasPermission(user.id, "businesses.update");

  if (!canReactivate) {
    return { success: false, message: "You do not have permission to reactivate businesses" };
  }

  const result = await reactivateBusiness(businessId, user.id);
  if (result.success) {
    revalidatePath("/platform/business-activations");
  }
  return result;
}

export async function isSetupFeePaidAction(businessId: string): Promise<ActionResponse & { data?: { paid: boolean; walletBalance: number; setupFee: number } }> {
  await requireAuth();

  const info = await getActivationInfo(businessId);
  if (!info) return { success: false, message: "Business not found" };

  return {
    success: true,
    message: "",
    data: {
      paid: info.walletBalance >= info.setupFee && info.status === "ACTIVE",
      walletBalance: info.walletBalance,
      setupFee: info.setupFee,
    },
  };
}
