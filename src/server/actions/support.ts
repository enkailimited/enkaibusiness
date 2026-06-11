"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  getTicketMetrics,
} from "@/server/services/support-service";
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
} from "@/lib/validations/support";
import type { ActionResponse } from "@/types/relationships";
import type { TicketFilters } from "@/server/services/support-service";

export async function createTicketAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    customerId: formData.get("customerId"),
    priority: formData.get("priority") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createTicket(parsed.data);

  if (result.success) {
    revalidatePath("/support");
  }

  return result;
}

export async function getTicketsAction(filters?: TicketFilters) {
  await requireAuth();
  return getTickets(filters);
}

export async function getTicketAction(id: string) {
  await requireAuth();
  return getTicket(id);
}

export async function updateTicketAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateTicketSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateTicket(id, parsed.data);

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function updateTicketStatusAction(
  id: string,
  status: string,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateTicketStatusSchema.safeParse({ status });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateTicketStatus(id, parsed.data.status);

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function assignTicketAction(
  ticketId: string,
  userId: string,
): Promise<ActionResponse> {
  await requireAuth();
  const result = await assignTicket(ticketId, userId);

  if (result.success) {
    revalidatePath(`/support/${ticketId}`);
    revalidatePath("/support");
  }

  return result;
}

export async function getTicketMetricsAction() {
  await requireAuth();
  return getTicketMetrics();
}
