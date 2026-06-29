import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { UpdateStaffSchema, CreateAssignmentSchema } from "../schemas";
import type { StaffWithUser, StaffWithAssignments, StaffAssignmentWithDetails } from "../types";

export async function updateStaff(
  id: string,
  data: UpdateStaffSchema,
): Promise<ActionResponse & { data?: StaffWithUser }> {
  try {
    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });

    return {
      success: true,
      message: "Staff updated successfully",
      data: staff as unknown as StaffWithUser,
    };
  } catch (error) {
    console.error("Update staff error:", error);
    return { success: false, message: "Failed to update staff" };
  }
}

export async function getStaff(id: string) {
  return prisma.staff.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      assignments: {
        include: {
          branch: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          role: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getStaffByUser(userId: string, businessId?: string) {
  return prisma.staff.findFirst({
    where: { userId, ...(businessId ? { businessId } : {}) },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      assignments: {
        include: {
          branch: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          role: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getBusinessStaff(businessId: string): Promise<StaffWithUser[]> {
  const staff = await prisma.staff.findMany({
    where: { businessId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
      },
      assignments: {
        include: {
          role: { select: { id: true, name: true, slug: true } },
          branch: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return staff as unknown as StaffWithUser[];
}

export async function getBranchStaff(branchId: string): Promise<StaffWithAssignments[]> {
  const assignments = await prisma.staffAssignment.findMany({
    where: { branchId },
    include: {
      staff: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });

  const staffMap = new Map<string, StaffWithAssignments>();

  for (const assignment of assignments) {
    const s = assignment.staff;
    if (!staffMap.has(s.id)) {
      staffMap.set(s.id, {
        ...s,
        user: s.user,
        assignments: [],
      } as unknown as StaffWithAssignments);
    }
  }

  return Array.from(staffMap.values());
}

export async function getStoreStaff(storeId: string): Promise<StaffWithUser[]> {
  const assignments = await prisma.staffAssignment.findMany({
    where: { storeId },
    include: {
      staff: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return assignments.map((a) => a.staff) as unknown as StaffWithUser[];
}

export async function createAssignment(
  data: CreateAssignmentSchema,
): Promise<ActionResponse & { data?: StaffAssignmentWithDetails }> {
  try {
    const existing = await prisma.staffAssignment.findFirst({
      where: {
        staffId: data.staffId,
        level: data.level,
        branchId: data.branchId ?? null,
        storeId: data.storeId ?? null,
      },
    });

    if (existing) {
      return { success: false, message: "Staff already has an assignment at this level" };
    }

    const assignment = await prisma.staffAssignment.create({
      data: {
        staffId: data.staffId,
        level: data.level,
        businessId: data.businessId,
        branchId: data.branchId,
        storeId: data.storeId,
        roleId: data.roleId,
        isPrimary: data.isPrimary ?? false,
      },
      include: {
        branch: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
    });

    return {
      success: true,
      message: "Assignment created successfully",
      data: assignment as unknown as StaffAssignmentWithDetails,
    };
  } catch (error) {
    console.error("Create assignment error:", error);
    return { success: false, message: "Failed to create assignment" };
  }
}

export async function removeAssignment(
  assignmentId: string,
): Promise<ActionResponse> {
  try {
    await prisma.staffAssignment.delete({ where: { id: assignmentId } });
    return { success: true, message: "Assignment removed successfully" };
  } catch (error) {
    console.error("Remove assignment error:", error);
    return { success: false, message: "Failed to remove assignment" };
  }
}

export async function getStaffAssignments(
  staffId: string,
): Promise<StaffAssignmentWithDetails[]> {
  const assignments = await prisma.staffAssignment.findMany({
    where: { staffId },
    include: {
      branch: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return assignments as unknown as StaffAssignmentWithDetails[];
}

export async function deleteStaff(id: string): Promise<ActionResponse> {
  try {
    await prisma.staff.delete({ where: { id } });
    return { success: true, message: "Staff deleted successfully" };
  } catch (error) {
    console.error("Delete staff error:", error);
    return { success: false, message: "Failed to delete staff" };
  }
}
