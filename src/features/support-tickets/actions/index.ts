"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
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
  const user = await requireAuth();
  const businessId = (formData.get("businessId") as string) || undefined;
  const can = await hasPermission(user.id, "support_tickets.create", businessId);
  if (!can) return { success: false, message: "You do not have permission to create support tickets" };

  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    customerId: formData.get("customerId"),
    priority: formData.get("priority") || undefined,
    businessId: businessId,
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
  const user = await requireAuth();
  const can = await hasPermission(user.id, "support_tickets.update");
  if (!can) return { success: false, message: "You do not have permission to update support tickets" };

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
  const user = await requireAuth();
  const can = await hasPermission(user.id, "support_tickets.update");
  if (!can) return { success: false, message: "You do not have permission to update support tickets" };

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
  const user = await requireAuth();
  const can = await hasPermission(user.id, "support_tickets.update");
  if (!can) return { success: false, message: "You do not have permission to assign support tickets" };

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
  const user = await requireAuth();
  const can = await hasPermission(user.id, "support_tickets.update");
  if (!can) return { success: false, message: "You do not have permission to resolve support tickets" };
  const result = await updateTicketStatus(id, "RESOLVED");

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function closeTicketAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "support_tickets.update");
  if (!can) return { success: false, message: "You do not have permission to close support tickets" };
  const result = await updateTicketStatus(id, "CLOSED");

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function reopenTicketAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "support_tickets.update");
  if (!can) return { success: false, message: "You do not have permission to reopen support tickets" };
  const result = await updateTicketStatus(id, "OPEN");

  if (result.success) {
    revalidatePath(`/support/${id}`);
    revalidatePath("/support");
  }

  return result;
}

export async function deleteTicketAction(id: string): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "support_tickets.delete");
  if (!can) return { success: false, message: "You do not have permission to delete support tickets" };
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
