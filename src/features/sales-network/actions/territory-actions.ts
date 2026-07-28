"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { prisma } from "@/server/db";
import { z } from "zod";

const createTerritorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetRevenue: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional(),
  ),
  marketSize: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().optional(),
  ),
  color: z.string().optional(),
});

const updateTerritorySchema = createTerritorySchema.partial();

export async function createTerritoryAction(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();

    const canCreate = await hasPermission(authUser.id, "sales_network.create");
    if (!canCreate) {
      return { success: false, message: "You do not have permission to create territories" };
    }

    const parsed = createTerritorySchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      targetRevenue: formData.get("targetRevenue"),
      marketSize: formData.get("marketSize"),
      color: formData.get("color"),
    });

    await prisma.territory.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        targetRevenue: parsed.targetRevenue ?? null,
        marketSize: parsed.marketSize ?? null,
        color: parsed.color ?? "#3b82f6",
      },
    });

    revalidatePath("/platform/sales-team/territories/manage");
    return { success: true, message: "Territory created successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues.map((e: { message: string }) => e.message).join(", ") };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to create territory" };
  }
}

export async function updateTerritoryAction(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();
    const id = formData.get("id") as string;

    const canUpdate = await hasPermission(authUser.id, "sales_network.update");
    if (!canUpdate) {
      return { success: false, message: "You do not have permission to update territories" };
    }
    if (!id) return { success: false, message: "Territory ID is required" };

    const parsed = updateTerritorySchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      targetRevenue: formData.get("targetRevenue"),
      marketSize: formData.get("marketSize"),
      color: formData.get("color"),
    });

    await prisma.territory.update({
      where: { id },
      data: parsed,
    });

    revalidatePath("/platform/sales-team/territories/manage");
    return { success: true, message: "Territory updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues.map((e: { message: string }) => e.message).join(", ") };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to update territory" };
  }
}

export async function deleteTerritoryAction(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();

    const canDelete = await hasPermission(authUser.id, "sales_network.delete");
    if (!canDelete) {
      return { success: false, message: "You do not have permission to delete territories" };
    }

    await prisma.territory.delete({ where: { id } });
    revalidatePath("/platform/sales-team/territories/manage");
    return { success: true, message: "Territory deleted successfully" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to delete territory" };
  }
}

export async function assignSalesProfileToTerritoryAction(
  territoryId: string,
  salesProfileId: string,
  isPrimary: boolean = false,
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();

    const canUpdate = await hasPermission(authUser.id, "sales_network.update");
    if (!canUpdate) {
      return { success: false, message: "You do not have permission to assign territory members" };
    }

    const existing = await prisma.territoryAssignment.findUnique({
      where: { territoryId_salesProfileId: { territoryId, salesProfileId } },
    });
    if (existing) {
      return { success: false, message: "This member is already assigned to the territory" };
    }

    await prisma.territoryAssignment.create({
      data: { territoryId, salesProfileId, isPrimary },
    });

    revalidatePath("/platform/sales-team/territories/manage");
    return { success: true, message: "Member assigned to territory" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to assign member" };
  }
}

export async function removeSalesProfileFromTerritoryAction(
  territoryId: string,
  salesProfileId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();

    const canUpdate = await hasPermission(authUser.id, "sales_network.update");
    if (!canUpdate) {
      return { success: false, message: "You do not have permission to remove territory members" };
    }

    await prisma.territoryAssignment.delete({
      where: { territoryId_salesProfileId: { territoryId, salesProfileId } },
    });
    revalidatePath("/platform/sales-team/territories/manage");
    return { success: true, message: "Member removed from territory" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to remove member" };
  }
}

export async function listTerritoriesAction() {
  try {
    await requireAuth();
    const territories = await prisma.territory.findMany({
      include: {
        members: {
          include: {
            salesProfile: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                hierarchy: { select: { title: true } },
              },
            },
          },
        },
        _count: { select: { leads: true } },
      },
      orderBy: { name: "asc" },
    });
    return { success: true as const, territories };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Failed to list territories" };
  }
}

export async function getTerritoryAction(id: string) {
  try {
    await requireAuth();
    const territory = await prisma.territory.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            salesProfile: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                hierarchy: { select: { title: true } },
              },
            },
          },
        },
        leads: {
          include: {
            assignedTo: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: { select: { leads: true } },
      },
    });
    if (!territory) return { success: false as const, message: "Territory not found" };
    return { success: true as const, territory };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Failed to get territory" };
  }
}

export async function getMyTerritoriesAction() {
  try {
    const authUser = await requireAuth();
    const profile = await prisma.salesProfile.findUnique({
      where: { userId: authUser.id },
      select: { id: true },
    });
    if (!profile) return { success: true as const, territories: [] };

    const territories = await prisma.territory.findMany({
      where: {
        members: { some: { salesProfileId: profile.id } },
        isActive: true,
      },
      include: {
        _count: { select: { leads: true } },
        members: {
          where: { isPrimary: true },
          include: {
            salesProfile: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return { success: true as const, territories };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Failed to get territories" };
  }
}

export async function listAvailableSalesProfilesAction() {
  try {
    await requireAuth();
    const profiles = await prisma.salesProfile.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        hierarchy: { select: { title: true } },
      },
      orderBy: { user: { firstName: "asc" } },
    });
    return { success: true as const, profiles };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Failed to list profiles" };
  }
}
