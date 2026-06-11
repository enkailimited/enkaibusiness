import "server-only";

import type { TicketPriority } from "@prisma/client";
import { prisma } from "@/server/db";
import type { ActionResponse, PaginatedResponse } from "@/types/relationships";
import type { CreateTicketSchema, UpdateTicketSchema, TicketFilterSchema } from "../schemas";
import type { TicketWithRelations } from "../types";

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
        businessId: data.businessId || null,
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

export async function getTicket(id: string): Promise<TicketWithRelations | null> {
  const raw = await prisma.supportTicket.findUnique({
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

  return raw as unknown as TicketWithRelations | null;
}

export async function listTickets(
  filter?: TicketFilterSchema,
): Promise<PaginatedResponse<TicketWithRelations>> {
  const where: Record<string, unknown> = {};

  if (filter?.status) {
    where.status = filter.status;
  }

  if (filter?.priority) {
    where.priority = filter.priority;
  }

  if (filter?.assignedToId) {
    where.assignedToId = filter.assignedToId;
  }

  if (filter?.customerId) {
    where.customerId = filter.customerId;
  }

  if (filter?.businessId) {
    where.businessId = filter.businessId;
  }

  if (filter?.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  if (filter?.fromDate || filter?.toDate) {
    const createdAt: Record<string, Date> = {};
    if (filter?.fromDate) createdAt.gte = new Date(filter.fromDate);
    if (filter?.toDate) createdAt.lte = new Date(filter.toDate);
    where.createdAt = createdAt;
  }

  const page = filter?.page ?? 1;
  const limit = filter?.limit ?? 20;

  const [raw, total] = await Promise.all([
    prisma.supportTicket.findMany({
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
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    data: raw as unknown as TicketWithRelations[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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

export async function resolveTicket(id: string): Promise<ActionResponse> {
  return updateTicketStatus(id, "RESOLVED");
}

export async function closeTicket(id: string): Promise<ActionResponse> {
  return updateTicketStatus(id, "CLOSED");
}

export async function reopenTicket(id: string): Promise<ActionResponse> {
  return updateTicketStatus(id, "OPEN");
}

export async function deleteTicket(id: string): Promise<ActionResponse> {
  try {
    await prisma.supportTicket.delete({ where: { id } });
    return { success: true, message: "Ticket deleted successfully" };
  } catch (error) {
    console.error("Delete ticket error:", error);
    return { success: false, message: "Failed to delete ticket" };
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
