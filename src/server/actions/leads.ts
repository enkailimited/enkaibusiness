"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
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
  getLeadMetrics,
} from "@/server/services/lead-service";
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  createLeadActivitySchema,
} from "@/lib/validations/lead";
import type { ActionResponse } from "@/types/relationships";
import type { LeadFilters } from "@/server/services/lead-service";
import { generateTempPassword, setUserPassword, sendInviteEmail } from "@/features/users/services/invite-service";

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

  const result = await assignLead(
    parsed.data.leadId,
    parsed.data.assignedToId,
    user.id,
    parsed.data.reason,
  );

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

  const result = await addLeadActivity(
    parsed.data.leadId,
    parsed.data.action,
    parsed.data.detail,
    user.id,
  );

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
    revalidatePath("/onboarding");
  }

  return result;
}

export async function getLeadMetricsAction() {
  await requireAuth();
  return getLeadMetrics();
}

export async function resendLeadCredentialsAction(
  leadId: string,
  newEmail?: string,
): Promise<ActionResponse> {
  try {
    const agent = await requireAuth();

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { success: false, message: "Lead not found" };
    if (!lead.convertedToUserId) return { success: false, message: "Lead has not been converted yet" };

    const targetEmail = newEmail || lead.email;
    if (!targetEmail) return { success: false, message: "No email address available" };

    const user = await prisma.user.findUnique({ where: { id: lead.convertedToUserId } });
    if (!user) return { success: false, message: "Converted user not found" };

    if (!user.mustChangePassword) {
      return { success: false, message: "User has already changed their password. Resend is disabled." };
    }

    if (newEmail && newEmail !== user.email) {
      await prisma.user.update({ where: { id: user.id }, data: { email: newEmail } });
      await prisma.lead.update({ where: { id: leadId }, data: { email: newEmail } });
    }

    const tempPassword = generateTempPassword();
    await setUserPassword(user.id, tempPassword);

    const invitedByName = `${agent.firstName} ${agent.lastName}`.trim() || "Admin";
    const emailSent = await sendInviteEmail(targetEmail, tempPassword, invitedByName, "Enkai Business", true);

    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "CREDENTIALS_RESENT",
        detail: `Credentials resent to ${targetEmail}${emailSent ? "" : " (email delivery failed)"}`,
        createdById: agent.id,
      },
    });

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");

    return {
      success: true,
      message: emailSent
        ? "Credentials resent successfully"
        : "Password reset but email could not be sent. Contact the user manually.",
    };
  } catch (error) {
    console.error("Resend credentials error:", error);
    return { success: false, message: "Failed to resend credentials" };
  }
}
