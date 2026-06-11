"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { serialize } from "@/lib/utils";
import {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  subscribe,
  getSubscriptions,
  getSubscription,
  updateSubscriptionStatus,
  recordPayment,
  getSubscriptionPayments,
  checkExpiringSubscriptions,
  getSubscriptionMetrics,
} from "@/server/services/subscription-service";
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  createSubscriptionSchema,
  recordPaymentSchema,
} from "@/lib/validations/subscription";
import type { ActionResponse } from "@/types/relationships";

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

export async function getPlansAction() {
  await requireAuth();
  const data = await getPlans();
  return serialize(data);
}

export async function getPlanAction(id: string) {
  await requireAuth();
  const data = await getPlan(id);
  return serialize(data);
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

export async function getSubscriptionsAction(filters?: {
  status?: string;
  businessId?: string;
  planId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  await requireAuth();
  const data = await getSubscriptions(filters);
  return serialize(data);
}

export async function getSubscriptionAction(id: string) {
  await requireAuth();
  const data = await getSubscription(id);
  return serialize(data);
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

export async function getSubscriptionPaymentsAction(subscriptionId: string) {
  await requireAuth();
  const data = await getSubscriptionPayments(subscriptionId);
  return serialize(data);
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
  return getSubscriptionMetrics();
}
