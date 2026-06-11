import "server-only";

import { prisma } from "@/server/db";

export async function listSupportTickets(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        assignedTo: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.supportTicket.count(),
  ]);

  return { tickets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTicketStats() {
  const [open, inProgress, resolved, closed] = await Promise.all([
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    prisma.supportTicket.count({ where: { status: "CLOSED" } }),
  ]);

  return { open, inProgress, resolved, closed };
}
