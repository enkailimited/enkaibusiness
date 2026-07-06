import "server-only";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";

export async function getRoutePlan(installerId: string, date: string) {
  const installer = await prisma.installer.findUnique({
    where: { id: installerId },
    select: { id: true, gpsLat: true, gpsLng: true, firstName: true, lastName: true },
  });
  if (!installer) throw new Error("Installer not found");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const tickets = await prisma.installationTicket.findMany({
    where: {
      installerId,
      siteVisitDate: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ["ACTIVATED", "DECLINED"] },
    },
    include: {
      business: { select: { id: true, name: true, address: true, phone: true } },
      branch: { select: { id: true, name: true, city: true } },
      services: { select: { id: true, type: true, completed: true } },
    },
    orderBy: { siteVisitDate: "asc" },
  });

  const originLat = Number(installer.gpsLat) || 0;
  const originLng = Number(installer.gpsLng) || 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371;

  const stops = tickets.map((ticket) => {
    const destLat = 0;
    const destLng = 0;
    const dLat = toRad(destLat - originLat);
    const dLng = toRad(destLng - originLng);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;
    const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      businessName: ticket.business.name,
      address: ticket.business.address,
      branchName: ticket.branch?.name || null,
      city: ticket.branch?.city || null,
      scheduledTime: ticket.siteVisitDate,
      estimatedDistance: Math.round(distance * 100) / 100,
      services: ticket.services,
      status: ticket.status,
    };
  });

  return {
    installer: { id: installer.id, name: `${installer.firstName} ${installer.lastName}`, gpsLat: originLat, gpsLng: originLng },
    date,
    stops,
    totalStops: stops.length,
  };
}

export async function updateArrival(installerId: string, ticketId: string, gps?: { lat: number; lng: number }) {
  const installer = await prisma.installer.findUnique({ where: { id: installerId } });
  if (!installer) throw new Error("Installer not found");

  const gpsLat = gps ? new Prisma.Decimal(gps.lat) : null;
  const gpsLng = gps ? new Prisma.Decimal(gps.lng) : null;

  await prisma.installerTravelLog.create({
    data: {
      installerId,
      ticketId,
      status: "arrived",
      gpsLat,
      gpsLng,
      notes: "Arrived at site",
    },
  });

  const updateData: Record<string, unknown> = { travelStatus: "on_site", status: "BUSY" };
  if (gps) {
    updateData.gpsLat = gpsLat;
    updateData.gpsLng = gpsLng;
    updateData.lastGpsUpdate = new Date();
  }

  await prisma.installer.update({
    where: { id: installerId },
    data: updateData as any,
  });

  return prisma.installationTicket.update({
    where: { id: ticketId },
    data: { status: "SITE_VISIT_COMPLETED" },
    select: { id: true, ticketNumber: true, status: true, siteVisitDate: true },
  });
}

export async function updateDeparture(installerId: string, ticketId: string) {
  const installer = await prisma.installer.findUnique({ where: { id: installerId } });
  if (!installer) throw new Error("Installer not found");

  const openLog = await prisma.installerTravelLog.findFirst({
    where: { installerId, ticketId, completedAt: null },
    orderBy: { startedAt: "desc" },
  });

  if (openLog) {
    await prisma.installerTravelLog.update({
      where: { id: openLog.id },
      data: { status: "departed", completedAt: new Date() },
    });
  }

  await prisma.installerTravelLog.create({
    data: {
      installerId,
      ticketId,
      status: "departed",
      notes: "Departed from site",
    },
  });

  await prisma.installer.update({
    where: { id: installerId },
    data: { travelStatus: "returning" },
  });

  return { success: true, message: "Departure logged" };
}
