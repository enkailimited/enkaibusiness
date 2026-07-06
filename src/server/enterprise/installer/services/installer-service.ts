import "server-only";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { InstallerStatus } from "@prisma/client";
import { emitDistributorAssigned } from "@/modules/ai/events/event-bus";

const installerInclude = {
  include: {
    user: {
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
    },
    _count: {
      select: { tickets: true, travelLogs: true },
    },
  },
} as const;

export async function getInstallers(filters?: { status?: InstallerStatus; region?: string; city?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.region) where.region = filters.region;
  if (filters?.city) where.city = filters.city;

  return prisma.installer.findMany({
    where,
    ...installerInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getInstaller(id: string) {
  return prisma.installer.findUnique({
    where: { id },
    ...installerInclude,
  });
}

export async function getInstallerByUserId(userId: string) {
  return prisma.installer.findUnique({
    where: { userId },
    ...installerInclude,
  });
}

export async function createInstaller(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    employeeCode?: string;
    email?: string;
    phone?: string;
    photo?: string;
    region?: string;
    city?: string;
    specialization?: string;
    maxAssignments?: number;
  },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const existing = await prisma.installer.findUnique({ where: { userId } });
  if (existing) throw new Error("User is already registered as an installer");

  return prisma.installer.create({
    data: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      employeeCode: data.employeeCode || null,
      email: data.email || null,
      phone: data.phone || null,
      photo: data.photo || null,
      region: data.region || null,
      city: data.city || null,
      specialization: data.specialization || null,
      maxAssignments: data.maxAssignments ?? 5,
    },
    ...installerInclude,
  });
}

export async function updateInstaller(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    photo?: string;
    region?: string;
    city?: string;
    specialization?: string;
    maxAssignments?: number;
    employeeCode?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const installer = await prisma.installer.findUnique({ where: { id } });
  if (!installer) throw new Error("Installer not found");

  return prisma.installer.update({
    where: { id },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.photo !== undefined && { photo: data.photo || null }),
      ...(data.region !== undefined && { region: data.region || null }),
      ...(data.city !== undefined && { city: data.city || null }),
      ...(data.specialization !== undefined && { specialization: data.specialization || null }),
      ...(data.maxAssignments !== undefined && { maxAssignments: data.maxAssignments }),
      ...(data.employeeCode !== undefined && { employeeCode: data.employeeCode || null }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    },
    ...installerInclude,
  });
}

export async function updateInstallerStatus(id: string, status: InstallerStatus, gps?: { lat: number; lng: number }) {
  const installer = await prisma.installer.findUnique({ where: { id } });
  if (!installer) throw new Error("Installer not found");

  const updateData: Record<string, unknown> = { status };
  if (gps) {
    updateData.gpsLat = new Prisma.Decimal(gps.lat);
    updateData.gpsLng = new Prisma.Decimal(gps.lng);
    updateData.lastGpsUpdate = new Date();
  }

  return prisma.installer.update({
    where: { id },
    data: updateData as any,
  });
}

export async function updateGPS(id: string, lat: number, lng: number) {
  const installer = await prisma.installer.findUnique({ where: { id } });
  if (!installer) throw new Error("Installer not found");

  return prisma.installer.update({
    where: { id },
    data: {
      gpsLat: new Prisma.Decimal(lat),
      gpsLng: new Prisma.Decimal(lng),
      lastGpsUpdate: new Date(),
    },
  });
}

export async function assignToTicket(
  installerId: string,
  ticketId: string,
  assignedBy: string,
  scheduledDate?: string,
) {
  const installer = await prisma.installer.findUnique({ where: { id: installerId } });
  if (!installer) throw new Error("Installer not found");

  const ticket = await prisma.installationTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Installation ticket not found");

  if (installer.currentLoad >= installer.maxAssignments) {
    throw new Error("Installer has reached maximum assignment capacity");
  }

  const [updatedTicket] = await prisma.$transaction([
    prisma.installationTicket.update({
      where: { id: ticketId },
      data: {
        installerId,
        assignedAt: new Date(),
        siteVisitDate: scheduledDate ? new Date(scheduledDate) : ticket.siteVisitDate,
      },
    }),
    prisma.installer.update({
      where: { id: installerId },
      data: { currentLoad: { increment: 1 } },
    }),
  ]);

  emitDistributorAssigned(ticket.businessId, assignedBy, ticketId, {
    installerId,
    ticketNumber: updatedTicket.ticketNumber,
    distributorUserId: assignedBy,
    assignedBy,
    scheduledDate: scheduledDate ?? null,
  });

  return updatedTicket;
}

export async function getInstallerSchedule(installerId: string, dateFrom?: string, dateTo?: string) {
  const where: Record<string, unknown> = { installerId };
  if (dateFrom || dateTo) {
    where.assignedAt = {};
    if (dateFrom) (where.assignedAt as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.assignedAt as Record<string, unknown>).lte = new Date(dateTo);
  }

  return prisma.installationTicket.findMany({
    where: where as any,
    include: {
      business: { select: { id: true, name: true, address: true, phone: true } },
      branch: { select: { id: true, name: true, city: true } },
      package: { include: { package: true } },
    },
    orderBy: { siteVisitDate: "asc" },
  });
}

export async function getNearestInstallers(lat: number, lng: number, radiusKm: number = 50) {
  const allAvailable = await prisma.installer.findMany({
    where: {
      status: { in: ["AVAILABLE", "TRAVELING"] },
      gpsLat: { not: null },
      gpsLng: { not: null },
    },
    ...installerInclude,
  });

  const earthRadius = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return allAvailable
    .map((installer) => {
      const instLat = Number(installer.gpsLat);
      const instLng = Number(installer.gpsLng);
      const dLat = toRad(instLat - lat);
      const dLng = toRad(instLng - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat)) * Math.cos(toRad(instLat)) * Math.sin(dLng / 2) ** 2;
      const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...installer, distance: Math.round(distance * 100) / 100 };
    })
    .filter((i) => i.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

export async function updateTravelStatus(
  installerId: string,
  ticketId: string,
  status: string,
  gps?: { lat: number; lng: number },
  address?: string,
  notes?: string,
) {
  const installer = await prisma.installer.findUnique({ where: { id: installerId } });
  if (!installer) throw new Error("Installer not found");

  const openLog = await prisma.installerTravelLog.findFirst({
    where: { installerId, ticketId, completedAt: null },
    orderBy: { startedAt: "desc" },
  });

  const gpsLat = gps ? new Prisma.Decimal(gps.lat) : null;
  const gpsLng = gps ? new Prisma.Decimal(gps.lng) : null;

  if (openLog) {
    if (status === "arrived" || status === "completed" || status === "cancelled") {
      await prisma.installerTravelLog.update({
        where: { id: openLog.id },
        data: {
          status,
          completedAt: new Date(),
          gpsLat: gpsLat ?? openLog.gpsLat,
          gpsLng: gpsLng ?? openLog.gpsLng,
          address: address ?? openLog.address,
          notes: notes ?? openLog.notes,
        },
      });
    } else {
      await prisma.installerTravelLog.update({
        where: { id: openLog.id },
        data: {
          status,
          gpsLat: gpsLat ?? openLog.gpsLat,
          gpsLng: gpsLng ?? openLog.gpsLng,
          address: address ?? openLog.address,
          notes: notes ?? openLog.notes,
        },
      });
    }
  }

  if (status === "en_route" && !openLog) {
    await prisma.installerTravelLog.create({
      data: {
        installerId,
        ticketId,
        status: "en_route",
        gpsLat,
        gpsLng,
        address: address || null,
        notes: notes || null,
      },
    });
  }

  const gpsUpdate: Record<string, unknown> = {};
  if (gps) {
    gpsUpdate.gpsLat = gpsLat;
    gpsUpdate.gpsLng = gpsLng;
    gpsUpdate.lastGpsUpdate = new Date();
  }
  if (status === "en_route") {
    gpsUpdate.travelStatus = "traveling";
    gpsUpdate.status = "TRAVELING";
  } else if (status === "arrived") {
    gpsUpdate.travelStatus = "on_site";
  } else if (status === "departed") {
    gpsUpdate.travelStatus = "returning";
  } else if (status === "completed") {
    gpsUpdate.travelStatus = null;
    gpsUpdate.status = "AVAILABLE";
  }

  if (Object.keys(gpsUpdate).length > 0) {
    await prisma.installer.update({
      where: { id: installerId },
      data: gpsUpdate as any,
    });
  }

  return prisma.installerTravelLog.findMany({
    where: { installerId, ticketId },
    orderBy: { startedAt: "desc" },
  });
}

export async function getInstallerPerformance(installerId: string, period?: { dateFrom?: string; dateTo?: string }) {
  const installer = await prisma.installer.findUnique({
    where: { id: installerId },
    select: { id: true, firstName: true, lastName: true, totalInstallations: true, rating: true },
  });
  if (!installer) throw new Error("Installer not found");

  const ticketWhere: Record<string, unknown> = { installerId };
  if (period?.dateFrom || period?.dateTo) {
    ticketWhere.createdAt = {};
    if (period.dateFrom) (ticketWhere.createdAt as Record<string, unknown>).gte = new Date(period.dateFrom);
    if (period.dateTo) (ticketWhere.createdAt as Record<string, unknown>).lte = new Date(period.dateTo);
  }

  const [completedTickets, travelLogs] = await Promise.all([
    prisma.installationTicket.findMany({
      where: { ...ticketWhere, status: "ACTIVATED" } as any,
      select: { id: true, createdAt: true, activatedAt: true },
    }),
    prisma.installerTravelLog.findMany({
      where: { installerId, ...(period?.dateFrom || period?.dateTo ? { createdAt: {} as any } : {}) },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  let totalDuration = 0;
  let durationCount = 0;
  for (const ticket of completedTickets) {
    if (ticket.activatedAt) {
      totalDuration += (ticket.activatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      durationCount++;
    }
  }

  const travelStats = {
    totalTrips: travelLogs.length,
    completedTrips: travelLogs.filter((l) => l.status === "completed").length,
    cancelledTrips: travelLogs.filter((l) => l.status === "cancelled").length,
  };

  return {
    installer,
    completedJobs: completedTickets.length,
    averageCompletionHours: durationCount > 0 ? Math.round((totalDuration / durationCount) * 100) / 100 : 0,
    rating: installer.rating,
    travelStats,
  };
}

export async function addChecklistItem(ticketId: string, name: string, isRequired: boolean = true, sortOrder: number = 0) {
  const ticket = await prisma.installationTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket not found");

  return prisma.installerChecklistItem.create({
    data: { ticketId, name, isRequired, sortOrder },
  });
}

export async function completeChecklistItem(itemId: string, photoUrl?: string, notes?: string) {
  const item = await prisma.installerChecklistItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Checklist item not found");

  return prisma.installerChecklistItem.update({
    where: { id: itemId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      photoUrl: photoUrl || null,
      notes: notes || null,
    },
  });
}

export async function getChecklist(ticketId: string) {
  return prisma.installerChecklistItem.findMany({
    where: { ticketId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function uploadPhoto(ticketId: string, url: string, category: string, uploadedBy: string, caption?: string) {
  const ticket = await prisma.installationTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket not found");

  return prisma.installationPhoto.create({
    data: { ticketId, url, category, uploadedBy, caption: caption || null },
  });
}
