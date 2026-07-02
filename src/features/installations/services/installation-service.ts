import "server-only";
import { prisma } from "@/server/db";
import { getValidNextStatuses, INSTALLATION_STEPS } from "../constants";

export { getValidNextStatuses };

export function getInstallationProgress(current: string): { label: string; complete: boolean; active: boolean }[] {
  const steps = INSTALLATION_STEPS;
  const currentIdx = steps.indexOf(current);
  return steps.map((s, i) => ({
    label: s.replace(/_/g, " "),
    complete: i < currentIdx,
    active: i === currentIdx,
  }));
}

export async function createInstallationTicket(data: {
  businessId: string; branchId?: string; type?: string;
  requestedById: string; notes?: string;
}) {
  const now = new Date();
  const ticketNumber = `INST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const ticket = await prisma.installationTicket.create({
    data: {
      businessId: data.businessId,
      branchId: data.branchId || null,
      ticketNumber,
      type: (data.type as "NEW_BUSINESS" | "NEW_BRANCH" | "UPGRADE" | "MAINTENANCE" | "REPLACEMENT" | "REINSTALLATION") || "NEW_BUSINESS",
      status: "PENDING",
      requestedById: data.requestedById,
      notes: data.notes || null,
    },
    include: {
      business: { select: { name: true, slug: true } },
      branch: { select: { name: true } },
    },
  });

  return ticket;
}

export async function getInstallationTickets(businessId?: string) {
  const where: Record<string, unknown> = {};
  if (businessId) where.businessId = businessId;

  return prisma.installationTicket.findMany({
    where,
    select: {
      id: true, ticketNumber: true, type: true, status: true,
      siteVisitDate: true, ownerApproved: true, activatedAt: true,
      notes: true, createdAt: true, updatedAt: true,
      business: { select: { id: true, name: true, slug: true } },
      branch: { select: { id: true, name: true } },
      distributor: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { tasks: true, photos: true, trainingRecords: true, verifications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getInstallationTicketById(ticketId: string) {
  return prisma.installationTicket.findUnique({
    where: { id: ticketId },
    include: {
      business: { select: { id: true, name: true, slug: true } },
      branch: { select: { id: true, name: true } },
      distributor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      tasks: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { createdAt: "desc" } },
      trainingRecords: { orderBy: { createdAt: "desc" } },
      verifications: { orderBy: { createdAt: "desc" } },
      distributorAssignments: {
        include: { distributor: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateInstallationStatus(ticketId: string, newStatus: string, userId: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const validNext = VALID_TRANSITIONS[ticket.status] || [];
  if (!validNext.includes(newStatus)) {
    return { success: false, message: `Cannot transition from ${ticket.status} to ${newStatus}` };
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "ACTIVATED") updateData.activatedAt = new Date();
  if (newStatus === "SITE_VISIT_SCHEDULED") updateData.siteVisitDate = new Date();
  if (newStatus === "AWAITING_APPROVAL") updateData.ownerApproved = false;

  await prisma.installationTicket.update({ where: { id: ticketId }, data: updateData });
  return { success: true, message: `Status updated to ${newStatus.replace(/_/g, " ")}` };
}

export async function assignDistributor(ticketId: string, distributorId: string, assignedById: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { status: true, distributorId: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  await prisma.$transaction(async (tx) => {
    await tx.installationTicket.update({
      where: { id: ticketId },
      data: { distributorId, assignedAt: new Date(), status: "DISTRIBUTOR_ASSIGNED" },
    });
    await tx.distributorAssignment.create({
      data: { distributorId, ticketId, assignedById },
    });
    await tx.distributor.update({
      where: { id: distributorId },
      data: { currentLoad: { increment: 1 } },
    });
  });

  return { success: true, message: "Distributor assigned" };
}
