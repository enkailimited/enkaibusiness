"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { prisma } from "@/server/db";

function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getMyWeeklyReportsAction(salesProfileId: string) {
  await requireAuth();
  return prisma.weeklyReport.findMany({
    where: { salesProfileId },
    orderBy: { weekStart: "desc" },
    include: { reviewedBy: { select: { firstName: true, lastName: true } } },
  });
}

export async function getCurrentWeekReportAction(salesProfileId: string) {
  await requireAuth();
  const weekStart = getWeekStart();
  return prisma.weeklyReport.findUnique({
    where: { salesProfileId_weekStart: { salesProfileId, weekStart } },
  });
}

export async function upsertWeeklyReportAction(
  salesProfileId: string,
  data: { leadsContacted: number; demosDone: number; registrations: number; challenges?: string; nextPlan?: string },
) {
  const user = await requireAuth();

  const canCreate = await hasPermission(user.id, "sales_network.create");
  if (!canCreate) {
    return { success: false, message: "You do not have permission to submit weekly reports" };
  }

  const weekStart = getWeekStart();
  const report = await prisma.weeklyReport.upsert({
    where: { salesProfileId_weekStart: { salesProfileId, weekStart } },
    create: { salesProfileId, weekStart, ...data },
    update: { ...data, status: "DRAFT" },
  });
  revalidatePath("/platform/sales-team/reports");
  return { success: true, report };
}

export async function submitWeeklyReportAction(reportId: string) {
  const user = await requireAuth();

  const canUpdate = await hasPermission(user.id, "sales_network.update");
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to submit weekly reports" };
  }

  await prisma.weeklyReport.update({
    where: { id: reportId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  revalidatePath("/platform/sales-team/reports");
  return { success: true };
}

export async function reviewWeeklyReportAction(reportId: string, reviewNotes: string) {
  const user = await requireAuth();

  const canUpdate = await hasPermission(user.id, "sales_network.update");
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to review weekly reports" };
  }
  await prisma.weeklyReport.update({
    where: { id: reportId },
    data: { status: "REVIEWED", reviewedById: user.id, reviewedAt: new Date(), reviewNotes },
  });
  revalidatePath("/platform/sales-team/reports");
  return { success: true };
}

export async function getTeamReportsAction(managerProfileId: string) {
  await requireAuth();
  const team = await prisma.salesProfile.findMany({
    where: { managerId: managerProfileId },
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
  });
  const memberIds = team.map((m) => m.id);
  const reports = await prisma.weeklyReport.findMany({
    where: { salesProfileId: { in: memberIds } },
    orderBy: { weekStart: "desc" },
    include: { salesProfile: { select: { user: { select: { firstName: true, lastName: true } } } } },
  });
  return reports;
}
