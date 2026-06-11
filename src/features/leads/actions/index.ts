"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  transferLead,
  addLeadActivity,
  convertLead,
  deleteLead,
  getLeadMetrics,
} from "../services/lead-service";
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  createLeadActivitySchema,
  leadFilterSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import type { LeadFilters } from "../types";

export async function createLeadAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createLeadSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    businessName: formData.get("businessName") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createLead(parsed.data, user.id);

  if (result.success) {
    revalidatePath("/leads");
  }

  return result;
}

export async function getLeadsAction(filters?: LeadFilters) {
  await requireAuth();
  return getLeads(filters);
}

export async function getLeadAction(id: string) {
  await requireAuth();
  return getLead(id);
}

export async function updateLeadAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateLeadSchema.safeParse({
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    businessName: formData.get("businessName") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateLead(id, parsed.data);

  if (result.success) {
    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
  }

  return result;
}

export async function updateLeadStatusAction(
  id: string,
  status: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const result = await updateLeadStatus(id, status, user.id);

  if (result.success) {
    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
  }

  return result;
}

export async function assignLeadAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = assignLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    assignedToId: formData.get("assignedToId"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await assignLead(parsed.data.leadId, parsed.data.assignedToId, user.id, parsed.data.reason);

  if (result.success) {
    revalidatePath(`/leads/${parsed.data.leadId}`);
    revalidatePath("/leads");
  }

  return result;
}

export async function transferLeadAction(
  leadId: string,
  toUserId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const result = await transferLead(leadId, user.id, toUserId);

  if (result.success) {
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
  }

  return result;
}

export async function addLeadActivityAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createLeadActivitySchema.safeParse({
    leadId: formData.get("leadId"),
    action: formData.get("action"),
    detail: formData.get("detail") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await addLeadActivity(parsed.data.leadId, parsed.data.action, parsed.data.detail, user.id);

  if (result.success) {
    revalidatePath(`/leads/${parsed.data.leadId}`);
  }

  return result;
}

export async function convertLeadAction(
  leadId: string,
  convertedToUserId: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await convertLead(leadId, convertedToUserId);

  if (result.success) {
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
  }

  return result;
}

export async function deleteLeadAction(id: string) {
  await requireAuth();
  const result = await deleteLead(id);

  if (result.success) {
    revalidatePath("/leads");
  }

  return result;
}

export async function getLeadMetricsAction() {
  await requireAuth();
  return getLeadMetrics();
}
