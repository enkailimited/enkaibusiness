"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createTicket,
  getTicket,
  listTickets,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  deleteTicket,
  getTicketMetrics,
} from "../services/ticket-service";
import {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  ticketFilterSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

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
    businessId: formData.get("businessId") || undefined,
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

export async function getTicketAction(id: string) {
  await requireAuth();
  return getTicket(id);
}

export async function listTicketsAction(filter?: Record<string, unknown>) {
  await requireAuth();

  const parsed = filter ? ticketFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  return listTickets(parsed.data);
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

  if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
    return { success: false, message: "Invalid status" };
  }

  const result = await updateTicketStatus(id, status);

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

  const parsed = assignTicketSchema.safeParse({ ticketId, userId });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await assignTicket(ticketId, userId);

  if (result.success) {
    revalidatePath(`/support/${ticketId}`);
    revalidatePath("/support");
  }

  return result;
}

export async function resolveTicketAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await updateTicketStatus(id, "RESOLVED");

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function closeTicketAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await updateTicketStatus(id, "CLOSED");

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function reopenTicketAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await updateTicketStatus(id, "OPEN");

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function deleteTicketAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await deleteTicket(id);

  if (result.success) {
    revalidatePath("/support");
  }

  return result;
}

export async function getTicketMetricsAction() {
  await requireAuth();
  return getTicketMetrics();
}
