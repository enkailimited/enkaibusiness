import "server-only";
import { prisma } from "@/server/db";
import { createDefaultTasks } from "@/features/installations/services/task-service";
import { updateInstallationStatus } from "@/features/installations/services/installation-service";
import { SERVICE_TYPES_REQUIRING_TRAINING } from "../constants";

export async function initiateInstallation(ticketId: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true, businessId: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  await createDefaultTasks(ticketId);
  await prisma.installationTicket.update({
    where: { id: ticketId },
    data: { status: "PENDING" },
  });

  const { emitInstallationStarted } = await import("@/modules/ai/events/event-bus");
  emitInstallationStarted(ticket.businessId, "", ticketId, {});

  return { success: true, message: "Installation initiated" };
}

export async function assignDistributor(
  ticketId: string,
  distributorId: string,
  assignedBy: string,
) {
  const { assignDistributor: assignDistributorImpl } = await import(
    "@/features/installations/services/installation-service"
  );
  return assignDistributorImpl(ticketId, distributorId, assignedBy);
}

export async function scheduleVisit(ticketId: string, date: Date, notes?: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const result = await updateInstallationStatus(ticketId, "SITE_VISIT_SCHEDULED", "");
  if (!result.success) return result;

  await prisma.installationTicket.update({
    where: { id: ticketId },
    data: { siteVisitDate: date, siteVisitNotes: notes || null },
  });

  return { success: true, message: "Site visit scheduled" };
}

export async function recordTravel(
  ticketId: string,
  travelStatus: string,
  gpsLat?: number,
  gpsLng?: number,
) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const meta: Record<string, unknown> = {};
  if (gpsLat !== undefined) meta.gpsLat = gpsLat;
  if (gpsLng !== undefined) meta.gpsLng = gpsLng;
  meta.travelStatus = travelStatus;

  await prisma.installationTicket.update({
    where: { id: ticketId },
    data: { metadata: meta as any },
  });

  return { success: true, message: `Travel status: ${travelStatus}` };
}

export async function completeInstallationStep(
  ticketId: string,
  step: string,
  completedBy: string,
  metadata?: Record<string, unknown>,
) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true, businessId: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const result = await updateInstallationStatus(ticketId, step, completedBy);
  if (!result.success) return result;

  if (metadata) {
    const currentMeta = (await prisma.installationTicket.findUnique({
      where: { id: ticketId },
      select: { metadata: true },
    }))?.metadata as Record<string, unknown> | null;

    await prisma.installationTicket.update({
      where: { id: ticketId },
      data: {
        metadata: { ...(typeof currentMeta === "object" && currentMeta ? currentMeta : {}), ...metadata } as any,
      },
    });
  }

  const { emitInstallationStepCompleted } = await import("@/modules/ai/events/event-bus");
  emitInstallationStepCompleted(ticket.businessId, completedBy, ticketId, {
    step,
    previousStatus: ticket.status,
  });

  return { success: true, message: `Step ${step} completed` };
}

export interface TrainingData {
  staffCount: number;
  durationMinutes: number;
  topics: string[];
  trainerId: string;
  notes?: string;
}

export async function completeTraining(ticketId: string, trainingData: TrainingData) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, businessId: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const record = await prisma.installationTraining.create({
    data: {
      ticketId,
      topic: trainingData.topics.join(", "),
      trainedStaff: trainingData.staffCount,
      durationMinutes: trainingData.durationMinutes,
      trainerId: trainingData.trainerId,
      notes: trainingData.notes || null,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  const servicesNeedingTraining = await prisma.installationService.findMany({
    where: {
      ticketId,
      type: { in: SERVICE_TYPES_REQUIRING_TRAINING as any },
      completed: false,
    },
  });

  const allTrained = servicesNeedingTraining.length === 0;
  if (allTrained) {
    await updateInstallationStatus(ticketId, "STAFF_TRAINED", trainingData.trainerId);
  }

  const { emitTrainingCompleted } = await import("@/modules/ai/events/event-bus");
  emitTrainingCompleted(ticket.businessId, trainingData.trainerId, ticketId, {
    trainingId: record.id,
    staffCount: trainingData.staffCount,
  });

  return { success: true, message: "Training recorded", data: { id: record.id } };
}

export async function verifyInstallation(
  ticketId: string,
  type: string,
  verifiedBy: string,
  isApproved: boolean,
  notes?: string,
) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  await prisma.installationVerification.create({
    data: {
      ticketId,
      type,
      verifiedById: verifiedBy,
      isApproved,
      notes: notes || null,
      verifiedAt: new Date(),
    },
  });

  return { success: true, message: "Verification recorded" };
}

export async function customerSignoff(ticketId: string, signedBy: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      businessId: true,
      package: { select: { customerApproved: true, qrExperienceEnabled: true } },
    },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const pkg = ticket.package;

  const statusResult = await updateInstallationStatus(ticketId, "AWAITING_APPROVAL", signedBy);
  if (!statusResult.success) return statusResult;

  await prisma.installationTicket.update({
    where: { id: ticketId },
    data: {
      customerSigned: true,
      customerSignedAt: new Date(),
    },
  });

  if (pkg) {
    await prisma.installationTicketPackage.update({
      where: { ticketId },
      data: { customerApproved: true },
    });
  }

  return { success: true, message: "Customer signoff recorded" };
}

export async function goLive(ticketId: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      businessId: true,
      customerSigned: true,
      package: { select: { id: true, qrExperienceEnabled: true } },
      services: { select: { id: true, completed: true, type: true } },
    },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  if (!ticket.customerSigned) {
    return { success: false, message: "Customer must sign off before go-live" };
  }

  const allServicesDone = ticket.services.length === 0 || ticket.services.every((s) => s.completed);
  if (!allServicesDone) {
    return { success: false, message: "All installation services must be completed before go-live" };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.installationTicket.update({
      where: { id: ticketId },
      data: {
        goLiveAt: now,
        status: "ACTIVATED",
        activatedAt: now,
        ownerApproved: true,
        ownerApprovedAt: now,
      },
    });

    if (ticket.package) {
      await tx.installationTicketPackage.update({
        where: { ticketId },
        data: {
          qrExperienceEnabled: true,
          qrActivatedAt: now,
        },
      });
    }
  });

  const { emitInstallationCompleted } = await import("@/modules/ai/events/event-bus");
  emitInstallationCompleted(ticket.businessId, "", ticketId, {
    finalStatus: "ACTIVATED",
    goLiveAt: now.toISOString(),
  });

  return { success: true, message: "Go-live completed" };
}

export async function getInstallationProgress(ticketId: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
      services: true,
      trainingRecords: { orderBy: { createdAt: "desc" } },
      verifications: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { createdAt: "desc" }, take: 50 },
      package: true,
      distributor: { select: { id: true, firstName: true, lastName: true } },
      business: { select: { id: true, name: true } },
    },
  });
  if (!ticket) return null;

  return ticket;
}
