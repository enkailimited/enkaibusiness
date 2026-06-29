"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { serialize } from "@/lib/utils";
import {
  createPlan,
  getPlan,
  listPlans,
  updatePlan,
  togglePlanActive,
} from "../services/plan-service";
import {
  subscribe,
  getSubscription,
  listSubscriptions,
  cancelSubscription,
  renewSubscription,
  updateSubscriptionStatus,
  processSubscriptionRenewals,
  checkExpiringSubscriptions,
  getSubscriptionMetrics,
} from "../services/subscription-service";
import { recordPayment, getPayments } from "../services/payment-service";
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  createSubscriptionSchema,
  recordPaymentSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

// ─── Plan Actions ─────────────────────────────────────────────────────────

export async function createPlanAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createSubscriptionPlanSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    amount: Number(formData.get("amount")) || 0,
    currency: formData.get("currency") || "TZS",
    interval: formData.get("interval"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createPlan(parsed.data);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function listPlansAction() {
  await requireAuth();
  return serialize(listPlans());
}

export async function getPlanAction(id: string) {
  await requireAuth();
  return serialize(getPlan(id));
}

export async function updatePlanAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateSubscriptionPlanSchema.safeParse({
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount") ? Number(formData.get("amount")) : undefined,
    currency: formData.get("currency") || undefined,
    interval: formData.get("interval") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updatePlan(id, parsed.data);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function togglePlanActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await togglePlanActive(id, isActive);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

// ─── Subscription Actions ─────────────────────────────────────────────────

export async function subscribeAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createSubscriptionSchema.safeParse({
    planId: formData.get("planId"),
    businessId: formData.get("businessId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await subscribe(parsed.data);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function listSubscriptionsAction(filters?: {
  status?: string;
  businessId?: string;
  planId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  await requireAuth();
  return serialize(listSubscriptions(filters));
}

export async function getSubscriptionAction(id: string) {
  await requireAuth();
  return serialize(getSubscription(id));
}

export async function cancelSubscriptionAction(
  id: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await cancelSubscription(id);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function renewSubscriptionAction(id: string) {
  await requireAuth();
  const result = await renewSubscription(id);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function updateSubscriptionStatusAction(
  id: string,
  status: string,
) {
  await requireAuth();
  const result = await updateSubscriptionStatus(id, status);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

// ─── Payment Actions ──────────────────────────────────────────────────────

export async function recordPaymentAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = recordPaymentSchema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    amount: Number(formData.get("amount")) || 0,
    method: formData.get("method") || undefined,
    reference: formData.get("reference") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await recordPayment(parsed.data);

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function getPaymentsAction(subscriptionId: string) {
  await requireAuth();
  return serialize(getPayments(subscriptionId));
}

// ─── Maintenance Actions ──────────────────────────────────────────────────

export async function processSubscriptionRenewalsAction() {
  await requireAuth();
  const result = await processSubscriptionRenewals();

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function checkExpiringSubscriptionsAction() {
  await requireAuth();
  const result = await checkExpiringSubscriptions();

  if (result.success) {
    revalidatePath("/subscriptions");
  }

  return result;
}

export async function getSubscriptionMetricsAction() {
  await requireAuth();
  return serialize(getSubscriptionMetrics());
}
