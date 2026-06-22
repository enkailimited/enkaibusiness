"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  openSession,
  closeSession,
  getSession,
  getBusinessSessions,
} from "../services/pos-service";
import { createSessionSchema, closeSessionSchema, posSessionFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function openSessionAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createSessionSchema.safeParse({
    storeId: formData.get("storeId") || undefined,
    openingFloat: formData.get("openingFloat") || 0,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await openSession(parsed.data, businessId, user.id);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/pos`);
  }

  return result;
}

export async function closeSessionAction(
  sessionId: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = closeSessionSchema.safeParse({
    closingFloat: formData.get("closingFloat") || 0,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await closeSession(sessionId, parsed.data, user.id);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/pos`);
  }

  return result;
}

export async function getSessionAction(id: string) {
  await requireAuth();
  return getSession(id);
}

export async function listSessionsAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? posSessionFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return getBusinessSessions(businessId, parsed.data);
}
