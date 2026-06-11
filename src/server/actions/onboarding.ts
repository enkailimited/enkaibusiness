"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getOnboardingProgress,
  advanceStep,
  getOnboardingMetrics,
} from "@/server/services/onboarding-service";
import type { ActionResponse } from "@/types/relationships";
import { OnboardingStep } from "@/types/enums";

export async function getOnboardingProgressAction(leadId: string) {
  await requireAuth();
  return getOnboardingProgress(leadId);
}

export async function advanceOnboardingAction(
  leadId: string,
  step: OnboardingStep,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await advanceStep(leadId, step);

  if (result.success) {
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/onboarding");
  }

  return result;
}

export async function getOnboardingMetricsAction() {
  await requireAuth();
  return getOnboardingMetrics();
}
