"use server";

import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import { getPlatformKPIs, getBusinessKPIs } from "../services/kpi-service";
import { getDashboard } from "../services/dashboard-service";
import type { RoleDashboard, PlatformKPIs, BusinessKPIs } from "../types";
import type { ActionResponse } from "@/types/relationships";

export async function getDashboardDataAction(
  role: "platform" | "business",
  businessId?: string,
): Promise<ActionResponse & { data?: RoleDashboard }> {
  await requireAuth();
  try {
    const dashboard = await getDashboard(role, businessId);
    return { success: true, message: "Dashboard loaded", data: dashboard };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return { success: false, message: "Failed to load dashboard" };
  }
}

export async function getPlatformKPIsAction(): Promise<
  ActionResponse & { data?: PlatformKPIs }
> {
  await requireAuth();
  try {
    const kpis = await getPlatformKPIs();
    return { success: true, message: "KPIs loaded", data: kpis };
  } catch (error) {
    console.error("Platform KPIs error:", error);
    return { success: false, message: "Failed to load platform KPIs" };
  }
}

export async function getBusinessKPIsAction(
  businessId: string,
): Promise<ActionResponse & { data?: BusinessKPIs }> {
  await requireAuth();
  try {
    const kpis = await getBusinessKPIs(businessId);
    return { success: true, message: "KPIs loaded", data: kpis };
  } catch (error) {
    console.error("Business KPIs error:", error);
    return { success: false, message: "Failed to load business KPIs" };
  }
}

export async function getWorkspaceDashboardAction() {
  const user = await requireAuth();

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });

  if (!membership) return { businesses: 0, members: 0, branches: 0, workspaceName: "Workspace" };

  const wid = membership.workspaceId;

  const [businesses, members, branches, workspace] = await Promise.all([
    prisma.business.count({ where: { workspaceId: wid, isActive: true } }),
    prisma.workspaceMember.count({ where: { workspaceId: wid } }),
    prisma.branch.count({ where: { business: { workspaceId: wid }, isActive: true } }),
    prisma.workspace.findUnique({ where: { id: wid }, select: { name: true } }),
  ]);

  return serialize({ businesses, members, branches, workspaceName: workspace?.name ?? "Workspace" });
}
