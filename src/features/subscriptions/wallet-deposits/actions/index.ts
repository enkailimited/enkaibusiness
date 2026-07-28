"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  createDepositRequest,
  approveDepositRequest,
  rejectDepositRequest,
  listPendingDepositRequests,
  listDepositRequestsForBusiness,
} from "../services/deposit-request-service";
import { createDepositRequestSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function submitDepositRequestAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canSubmit = await hasPermission(user.id, "payments.process", businessId);
  if (!canSubmit) {
    return { success: false, message: "You do not have permission to submit deposit requests" };
  }

  const parsed = createDepositRequestSchema.safeParse({
    amount: formData.get("amount"),
    reference: formData.get("reference") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createDepositRequest(businessId, user.id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/wallet`);
  }

  return result;
}

export async function approveDepositRequestAction(
  requestId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canApprove = await hasPermission(user.id, "payments.approve");
  if (!canApprove) {
    return { success: false, message: "You do not have permission to approve deposit requests" };
  }

  const result = await approveDepositRequest(requestId, user.id);

  if (result.success) {
    revalidatePath("/platform/deposits");
  }

  return result;
}

export async function rejectDepositRequestAction(
  requestId: string,
  notes?: string,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canReject = await hasPermission(user.id, "payments.reject");
  if (!canReject) {
    return { success: false, message: "You do not have permission to reject deposit requests" };
  }

  const result = await rejectDepositRequest(requestId, user.id, notes);

  if (result.success) {
    revalidatePath("/platform/deposits");
  }

  return result;
}

export async function listPendingDepositsAction() {
  await requireAuth();
  return listPendingDepositRequests();
}

export async function listBusinessDepositRequestsAction(businessId: string) {
  await requireAuth();
  return listDepositRequestsForBusiness(businessId);
}
