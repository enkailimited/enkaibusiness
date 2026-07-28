"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { prisma } from "@/server/db";

export async function updateLeadStageAction(leadId: string, status: string) {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "leads.update");
  if (!can) return { success: false, message: "You do not have permission" };
  await prisma.lead.update({ where: { id: leadId }, data: { status: status as any } });
  revalidatePath("/platform/sales-team/leads");
  return { success: true };
}

export async function getPipelineStatsAction(salesProfileId?: string) {
  await requireAuth();
  const where = salesProfileId ? { assignedToId: salesProfileId } : {};
  const stages = await prisma.lead.groupBy({
    by: ["status"],
    where,
    _count: true,
  });
  const total = stages.reduce((sum, s) => sum + s._count, 0);
  const result: Record<string, number> = {};
  stages.forEach((s) => { result[s.status] = s._count; });
  return { stages: result, total };
}

export async function getTeamPipelineAction(managerProfileId: string) {
  await requireAuth();
  const team = await prisma.salesProfile.findMany({
    where: { managerId: managerProfileId },
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
      hierarchy: { select: { title: true } },
      _count: { select: { leads: true } },
    },
  });
  const memberStats = await Promise.all(
    team.map(async (m) => {
      const stages = await prisma.lead.groupBy({
        by: ["status"],
        where: { assignedToId: m.id },
        _count: true,
      });
      const stageMap: Record<string, number> = {};
      stages.forEach((s) => { stageMap[s.status] = s._count; });
      return {
        profileId: m.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        hierarchy: m.hierarchy?.title || "",
        totalLeads: m._count.leads,
        stages: stageMap,
      };
    }),
  );
  return memberStats;
}
