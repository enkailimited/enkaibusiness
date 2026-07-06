import "server-only";
import { prisma } from "@/server/db";
import type { InstallerDashboardData, TodayScheduleItem } from "../types";

export async function getInstallerDashboardData(installerId: string): Promise<InstallerDashboardData> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const installer = await prisma.installer.findUnique({
    where: { id: installerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      travelStatus: true,
      gpsLat: true,
      gpsLng: true,
      lastGpsUpdate: true,
      totalInstallations: true,
      rating: true,
      currentLoad: true,
    },
  });

  if (!installer) throw new Error("Installer not found");

  const upcomingTicketsQuery = prisma.installationTicket.findMany({
    where: {
      installerId,
      status: { notIn: ["ACTIVATED", "DECLINED"] as any },
      siteVisitDate: { gte: now },
    },
    orderBy: { siteVisitDate: "asc" },
    take: 10,
    include: {
      business: { select: { id: true, name: true, address: true, phone: true } },
      branch: { select: { id: true, name: true, city: true } },
    },
  });

  const [
    upcomingTickets,
    completedThisMonth,
    pendingInstallations,
    todaySchedule,
    checklistData,
    performance,
  ] = await Promise.all([
    upcomingTicketsQuery,
    prisma.installationTicket.count({
      where: {
        installerId,
        status: "ACTIVATED",
        activatedAt: { gte: thisMonthStart },
      },
    }),
    prisma.installationTicket.count({
      where: {
        installerId,
        status: { notIn: ["ACTIVATED", "DECLINED"] as any },
      },
    }),
    getTodaySchedule(installerId, todayStart, todayEnd),
    getCurrentChecklistStatus(installerId),
    getPerformanceMetrics(installerId),
  ]);

  const gpsLastUpdated = installer.lastGpsUpdate
    ? Math.round((now.getTime() - installer.lastGpsUpdate.getTime()) / (1000 * 60))
    : null;

  const nextVisit = upcomingTickets[0]
    ? {
        ticketId: upcomingTickets[0].id,
        ticketNumber: upcomingTickets[0].ticketNumber,
        businessName: upcomingTickets[0].business.name,
        address: upcomingTickets[0].business.address,
        scheduledDate: upcomingTickets[0].siteVisitDate,
      }
    : null;

  return {
    installer: {
      id: installer.id,
      firstName: installer.firstName,
      lastName: installer.lastName,
      status: installer.status,
      travelStatus: installer.travelStatus,
    },
    upcomingInstallations: upcomingTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      businessName: t.business.name,
      businessAddress: t.business.address,
      branchName: t.branch?.name ?? null,
      scheduledDate: t.siteVisitDate,
      status: t.status,
    })),
    completedThisMonth,
    pendingInstallations,
    currentTravelStatus: installer.travelStatus ?? null,
    todaySchedule,
    performance: {
      avgCompletionHours: performance.avgCompletionHours,
      rating: installer.rating,
      totalInstallations: installer.totalInstallations,
      completedJobs: performance.completedJobs,
    },
    checklistStatus: checklistData,
    totalInstallationsAllTime: installer.totalInstallations,
    gpsLastUpdatedMinutesAgo: gpsLastUpdated,
    nextScheduledVisit: nextVisit,
  };
}

async function getTodaySchedule(installerId: string, todayStart: Date, todayEnd: Date): Promise<TodayScheduleItem[]> {
  const tickets = await prisma.installationTicket.findMany({
    where: {
      installerId,
      siteVisitDate: { gte: todayStart, lt: todayEnd },
    },
    orderBy: { siteVisitDate: "asc" },
    include: {
      business: { select: { id: true, name: true, address: true, phone: true } },
      branch: { select: { id: true, name: true, city: true } },
    },
  });

  return tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    businessName: t.business.name,
    businessAddress: t.business.address,
    branchName: t.branch?.name ?? null,
    scheduledDate: t.siteVisitDate,
    status: t.status,
  }));
}

async function getCurrentChecklistStatus(installerId: string) {
  const currentTicket = await prisma.installationTicket.findFirst({
    where: {
      installerId,
      status: { notIn: ["ACTIVATED", "DECLINED"] as any },
    },
    orderBy: { siteVisitDate: "asc" },
    select: { id: true, ticketNumber: true },
  });

  if (!currentTicket) return null;

  const items = await prisma.installerChecklistItem.findMany({
    where: { ticketId: currentTicket.id },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, isCompleted: true, sortOrder: true },
  });

  const total = items.length;
  const completed = items.filter((i) => i.isCompleted).length;

  return {
    ticketId: currentTicket.id,
    ticketNumber: currentTicket.ticketNumber,
    totalItems: total,
    completedItems: completed,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    items,
  };
}

async function getPerformanceMetrics(installerId: string) {
  const completedTickets = await prisma.installationTicket.findMany({
    where: { installerId, status: "ACTIVATED" },
    select: { id: true, createdAt: true, activatedAt: true },
  });

  let totalDuration = 0;
  let durationCount = 0;
  for (const ticket of completedTickets) {
    if (ticket.activatedAt) {
      totalDuration += (ticket.activatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      durationCount++;
    }
  }

  return {
    completedJobs: completedTickets.length,
    avgCompletionHours: durationCount > 0 ? Math.round((totalDuration / durationCount) * 100) / 100 : 0,
  };
}
