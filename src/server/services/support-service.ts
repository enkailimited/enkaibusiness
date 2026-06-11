import "server-only";

import type { TicketPriority } from "@prisma/client";
import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateTicketSchema, UpdateTicketSchema } from "@/lib/validations/support";

export interface TicketFilters {
  status?: string;
  priority?: string;
  assignedToId?: string;
  customerId?: string;
  search?: string;
}

export async function createTicket(
  data: CreateTicketSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        title: data.title,
        description: data.description || null,
        customerId: data.customerId,
        priority: (data.priority as TicketPriority) || "MEDIUM",
      },
    });

    return {
      success: true,
      message: "Support ticket created successfully",
      data: { id: ticket.id },
    };
  } catch (error) {
    console.error("Create ticket error:", error);
    return { success: false, message: "Failed to create support ticket" };
  }
}

export async function getTickets(filters?: TicketFilters) {
  const where: Record<string, unknown> = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.priority) {
    where.priority = filters.priority;
  }

  if (filters?.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters?.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.supportTicket.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTicket(id: string) {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function updateTicket(
  id: string,
  data: UpdateTicketSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.priority !== undefined) updateData.priority = data.priority;

    await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Ticket updated successfully" };
  } catch (error) {
    console.error("Update ticket error:", error);
    return { success: false, message: "Failed to update ticket" };
  }
}

export async function updateTicketStatus(
  id: string,
  status: string,
): Promise<ActionResponse> {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return { success: false, message: "Ticket not found" };
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolvedAt = new Date();
    }

    if (status === "OPEN") {
      updateData.resolvedAt = null;
    }

    await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: `Ticket status updated to ${status}` };
  } catch (error) {
    console.error("Update ticket status error:", error);
    return { success: false, message: "Failed to update ticket status" };
  }
}

export async function assignTicket(
  ticketId: string,
  userId: string,
): Promise<ActionResponse> {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return { success: false, message: "Ticket not found" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId: userId },
    });

    return { success: true, message: "Ticket assigned successfully" };
  } catch (error) {
    console.error("Assign ticket error:", error);
    return { success: false, message: "Failed to assign ticket" };
  }
}

export async function getTicketMetrics() {
  const [open, inProgress, resolved, closed] = await Promise.all([
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    prisma.supportTicket.count({ where: { status: "CLOSED" } }),
  ]);

  return { open, inProgress, resolved, closed };
}
