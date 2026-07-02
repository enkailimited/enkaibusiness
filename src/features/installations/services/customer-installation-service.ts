import "server-only";
import { prisma } from "@/server/db";

export async function getCustomerInstallation(businessId: string) {
  return prisma.installationTicket.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, ticketNumber: true, type: true, status: true,
      siteVisitDate: true, ownerApproved: true, activatedAt: true,
      notes: true, createdAt: true, updatedAt: true,
      _count: { select: { tasks: true, photos: true, trainingRecords: true } },
      tasks: {
        select: { id: true, name: true, description: true, category: true, isCompleted: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}
