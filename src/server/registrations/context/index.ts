import "server-only";

import { prisma } from "@/server/db";

export enum RegistrationContext {
  PLATFORM = "platform",
  WORKSPACE = "workspace",
  BUSINESS = "business",
  SALES_TEAM = "sales_team",
}

export interface ContextAdapterParams {
  userId: string;
  businessId?: string | null;
  roleId?: string | null;
  hierarchyId?: string | null;
  managerId?: string | null;
  workspaceId?: string | null;
  workspaceRole?: string;
  branchId?: string | null;
  storeId?: string | null;
  level?: string | null;
  position?: string | null;
  employeeCode?: string | null;
  hireDate?: string | null;
}

export interface ContextAdapter {
  context: RegistrationContext;
  assign: (tx: typeof prisma, params: ContextAdapterParams) => Promise<{ membershipId?: string | null }>;
}

export const platformAdapter: ContextAdapter = {
  context: RegistrationContext.PLATFORM,
  async assign(tx, { userId, roleId }) {
    if (!roleId) return {};
    const existing = await (tx as typeof prisma).userRole.findFirst({
      where: { userId, roleId, businessId: null },
    });
    if (!existing) {
      await (tx as typeof prisma).userRole.create({
        data: { userId, roleId, businessId: null },
      });
    }
    return {};
  },
};

export const workspaceAdapter: ContextAdapter = {
  context: RegistrationContext.WORKSPACE,
  async assign(tx, { userId, workspaceId, workspaceRole }) {
    if (!workspaceId) return {};
    const existing = await (tx as typeof prisma).workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (existing) return {};
    const member = await (tx as typeof prisma).workspaceMember.create({
      data: {
        userId,
        workspaceId,
        role: (workspaceRole as any) ?? "MEMBER",
      },
    });

    // Also create RBAC UserRole for the workspace role
    if (workspaceRole) {
      const roleSlug = `${workspaceRole.toLowerCase()}-workspace`;
      const rbacRole = await (tx as typeof prisma).role.findUnique({
        where: { slug: roleSlug },
        select: { id: true },
      });
      if (rbacRole) {
        const existingRole = await (tx as typeof prisma).userRole.findFirst({
          where: { userId, roleId: rbacRole.id, businessId: null },
        });
        if (!existingRole) {
          await (tx as typeof prisma).userRole.create({
            data: { userId, roleId: rbacRole.id, businessId: null },
          });
        }
      }
    }

    return { membershipId: member.id };
  },
};

export const businessAdapter: ContextAdapter = {
  context: RegistrationContext.BUSINESS,
  async assign(tx, { userId, businessId, roleId, branchId, storeId, level, position, employeeCode, hireDate }) {
    if (!businessId) return {};
    let membershipId: string | null = null;

    if (roleId) {
      const existing = await (tx as typeof prisma).userRole.findFirst({
        where: { userId, roleId, businessId },
      });
      if (!existing) {
        await (tx as typeof prisma).userRole.create({
          data: { userId, roleId, businessId },
        });
      }
    }

    const existingStaff = await (tx as typeof prisma).staff.findFirst({
      where: { userId, businessId },
    });
    if (!existingStaff) {
      const staff = await (tx as typeof prisma).staff.create({
        data: {
          userId,
          businessId,
          position: position ?? null,
          employeeCode: employeeCode ?? null,
          hireDate: hireDate ? new Date(hireDate) : null,
        },
      });
      membershipId = staff.id;

      if (roleId || branchId || storeId || level) {
        await (tx as typeof prisma).staffAssignment.create({
          data: {
            staffId: staff.id,
            businessId,
            level: level ?? (storeId ? "store" : branchId ? "branch" : "business"),
            branchId: branchId ?? null,
            storeId: storeId ?? null,
            roleId: roleId ?? null,
            isPrimary: true,
          },
        });
      }
    }

    return { membershipId };
  },
};

export const salesTeamAdapter: ContextAdapter = {
  context: RegistrationContext.SALES_TEAM,
  async assign(tx, { userId, hierarchyId, managerId }) {
    const existing = await (tx as typeof prisma).salesProfile.findUnique({
      where: { userId },
    });
    if (existing) return {};
    const profile = await (tx as typeof prisma).salesProfile.create({
      data: {
        userId,
        hierarchyId: hierarchyId ?? null,
        managerId: managerId ?? null,
        status: "ACTIVE",
      },
    });
    return { membershipId: profile.id };
  },
};

export const adapters: Record<RegistrationContext, ContextAdapter> = {
  [RegistrationContext.PLATFORM]: platformAdapter,
  [RegistrationContext.WORKSPACE]: workspaceAdapter,
  [RegistrationContext.BUSINESS]: businessAdapter,
  [RegistrationContext.SALES_TEAM]: salesTeamAdapter,
};
