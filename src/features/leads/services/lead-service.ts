import "server-only";

import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateLeadSchema, UpdateLeadSchema } from "../schemas";
import type { LeadWithAssignments, LeadWithActivities, LeadFilters, LeadMetrics } from "../types";
import { createAuthUser } from "@/server/registrations/shared/user-creation";
import { generateTempPassword, setUserPassword, sendInviteEmail } from "@/features/users/services/invite-service";

const assignedToInclude = {
  include: {
    user: { select: { id: true, firstName: true, lastName: true, email: true } },
  },
} as const;

export async function createLead(
  data: CreateLeadSchema,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    let assignedToId: string | undefined;
    if (createdById) {
      const profile = await prisma.salesProfile.findUnique({ where: { userId: createdById } });
      if (profile) assignedToId = profile.id;
    }

    const lead = await prisma.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        businessName: data.businessName || null,
        notes: data.notes || null,
        source: "MANUAL",
        status: "NEW",
        assignedToId,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        action: "CREATED",
        detail: "Lead was created",
        createdById: createdById || null,
      },
    });

    return {
      success: true,
      message: "Lead created successfully",
      data: { id: lead.id },
    };
  } catch (error) {
    console.error("Create lead error:", error);
    return { success: false, message: "Failed to create lead" };
  }
}

export async function getLeads(filters?: LeadFilters): Promise<LeadWithAssignments[]> {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.source) where.source = filters.source;
  if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
    }
  }

  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
      { businessName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedTo: assignedToInclude,
      _count: { select: { activities: true, assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return leads as unknown as LeadWithAssignments[];
}

export async function getLead(id: string): Promise<LeadWithActivities | null> {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
          },
          hierarchy: true,
        },
      },
      activities: {
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      assignments: {
        include: {
          assignedTo: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          assignedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  return lead as unknown as LeadWithActivities | null;
}

export async function updateLead(
  id: string,
  data: UpdateLeadSchema,
): Promise<ActionResponse> {
  try {
    await prisma.lead.update({ where: { id }, data });
    return { success: true, message: "Lead updated successfully" };
  } catch (error) {
    console.error("Update lead error:", error);
    return { success: false, message: "Failed to update lead" };
  }
}

export async function updateLeadStatus(
  id: string,
  status: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    const oldStatus = lead.status;
    const updateData: Record<string, unknown> = { status: status as LeadStatus };

    let wasConversion = false;

    if (status === "CONVERTED" && !lead.convertedToUserId) {
      if (!lead.email) {
        return { success: false, message: "Cannot convert lead without an email address" };
      }
      let user = await prisma.user.findUnique({ where: { email: lead.email } });
      if (!user) {
        const tempPassword = generateTempPassword();
        const created = await createAuthUser({
          email: lead.email,
          password: tempPassword,
          firstName: lead.firstName,
          lastName: lead.lastName,
        });
        if (!created) {
          return { success: false, message: "Failed to create auth user for lead conversion" };
        }
        user = await prisma.user.findUnique({ where: { email: lead.email } });
        if (!user) {
          return { success: false, message: "User was created but could not be retrieved" };
        }
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phone: lead.phone || null,
            mustChangePassword: true,
            isOnboarded: false,
          },
        });
      }
      updateData.convertedToUserId = user.id;
      updateData.convertedAt = new Date();
      wasConversion = true;
    }

    await prisma.lead.update({ where: { id }, data: updateData });

    if (wasConversion) {
      const user = await prisma.user.findUnique({ where: { email: lead.email! } });
      if (user) {
        const tempPassword = generateTempPassword();
        await setUserPassword(user.id, tempPassword);
        const invitedByName = "Enkai Business";
        await sendInviteEmail(lead.email!, tempPassword, invitedByName, "Enkai Business", false);
        await prisma.leadActivity.create({
          data: {
            leadId: id,
            action: "CREDENTIALS_SENT",
            detail: `Credentials sent to ${lead.email}`,
            createdById: userId || null,
          },
        });
      }
    }

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        action: "STATUS_CHANGE",
        detail: status === "CONVERTED" && oldStatus !== "CONVERTED"
          ? `Lead converted, user account created`
          : `Status changed from ${oldStatus} to ${status}`,
        createdById: userId || null,
      },
    });

    return { success: true, message: `Lead status updated to ${status}` };
  } catch (error) {
    console.error("Update lead status error:", error);
    return { success: false, message: "Failed to update lead status" };
  }
}

export async function assignLead(
  leadId: string,
  assignedToId: string,
  assignedById: string,
  reason?: string,
): Promise<ActionResponse> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    const profile = await prisma.salesProfile.findUnique({ where: { id: assignedToId } });
    if (!profile) {
      return { success: false, message: "Sales profile not found" };
    }

    await prisma.$transaction([
      prisma.lead.update({ where: { id: leadId }, data: { assignedToId } }),
      prisma.leadAssignment.create({
        data: { leadId, assignedToId, assignedById, reason: reason || null },
      }),
      prisma.leadActivity.create({
        data: {
          leadId,
          action: "ASSIGNED",
          detail: reason
            ? `Assigned to sales profile ${assignedToId}: ${reason}`
            : `Assigned to sales profile ${assignedToId}`,
          createdById: assignedById,
        },
      }),
    ]);

    return { success: true, message: "Lead assigned successfully" };
  } catch (error) {
    console.error("Assign lead error:", error);
    return { success: false, message: "Failed to assign lead" };
  }
}

export async function transferLead(
  leadId: string,
  fromUserId: string,
  toUserId: string,
): Promise<ActionResponse> {
  try {
    const toProfile = await prisma.salesProfile.findUnique({ where: { userId: toUserId } });
    if (!toProfile) {
      return { success: false, message: "Target sales profile not found" };
    }

    await prisma.$transaction([
      prisma.lead.update({ where: { id: leadId }, data: { assignedToId: toProfile.id } }),
      prisma.leadActivity.create({
        data: {
          leadId,
          action: "TRANSFERRED",
          detail: `Transferred from user ${fromUserId} to user ${toUserId}`,
          createdById: fromUserId,
        },
      }),
    ]);

    return { success: true, message: "Lead transferred successfully" };
  } catch (error) {
    console.error("Transfer lead error:", error);
    return { success: false, message: "Failed to transfer lead" };
  }
}

export async function addLeadActivity(
  leadId: string,
  action: string,
  detail?: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    await prisma.leadActivity.create({
      data: { leadId, action, detail: detail || null, createdById: userId || null },
    });
    return { success: true, message: "Activity recorded successfully" };
  } catch (error) {
    console.error("Add lead activity error:", error);
    return { success: false, message: "Failed to record activity" };
  }
}

export async function getLeadTimeline(leadId: string) {
  return prisma.leadActivity.findMany({
    where: { leadId },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function convertLead(
  leadId: string,
  convertedToUserId: string,
): Promise<ActionResponse> {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "CONVERTED", convertedToUserId, convertedAt: new Date() },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "CONVERTED",
        detail: `Lead converted, user: ${convertedToUserId}`,
        createdById: convertedToUserId,
      },
    });

    return { success: true, message: "Lead converted successfully" };
  } catch (error) {
    console.error("Convert lead error:", error);
    return { success: false, message: "Failed to convert lead" };
  }
}

export async function deleteLead(id: string): Promise<ActionResponse> {
  try {
    await prisma.lead.delete({ where: { id } });
    return { success: true, message: "Lead deleted successfully" };
  } catch (error) {
    console.error("Delete lead error:", error);
    return { success: false, message: "Failed to delete lead" };
  }
}

export async function getLeadMetrics(): Promise<LeadMetrics> {
  const statusCounts = await prisma.lead.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const totalLeads = await prisma.lead.count();
  const totalConverted = await prisma.lead.count({ where: { status: "CONVERTED" } });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const convertedThisMonth = await prisma.lead.count({
    where: { status: "CONVERTED", convertedAt: { gte: startOfMonth } },
  });

  const lostCount = await prisma.lead.count({ where: { status: "LOST" } });

  return {
    totalLeads,
    totalConverted,
    convertedThisMonth,
    lostCount,
    conversionRate: totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0,
    statusBreakdown: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
  };
}
