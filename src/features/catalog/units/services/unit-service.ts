import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateUnitSchema, UpdateUnitSchema } from "../schemas";
import type { UnitWithCount } from "../types";

export async function createUnit(
  businessId: string,
  data: CreateUnitSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const unit = await prisma.unit.create({
      data: {
        name: data.name,
        abbreviation: data.abbreviation,
        type: data.type,
        isBase: data.isBase ?? false,
        businessId,
      },
    });

    return {
      success: true,
      message: "Unit created successfully",
      data: { id: unit.id },
    };
  } catch (error) {
    console.error("Create unit error:", error);
    return { success: false, message: "Failed to create unit" };
  }
}

export async function updateUnit(
  id: string,
  data: UpdateUnitSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    await prisma.unit.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: "Unit updated successfully",
      data: { id },
    };
  } catch (error) {
    console.error("Update unit error:", error);
    return { success: false, message: "Failed to update unit" };
  }
}

export async function getUnit(id: string) {
  return prisma.unit.findUnique({
    where: { id },
    include: { _count: { select: { catalogItems: true } } },
  });
}

export async function getBusinessUnits(businessId: string): Promise<UnitWithCount[]> {
  const units = await prisma.unit.findMany({
    where: { businessId },
    include: { _count: { select: { catalogItems: true } } },
    orderBy: { name: "asc" },
  });

  return units as unknown as UnitWithCount[];
}

export async function getUnitsByType(businessId: string, type: string) {
  return prisma.unit.findMany({
    where: { businessId, type },
    orderBy: { name: "asc" },
  });
}

export async function deleteUnit(id: string): Promise<ActionResponse> {
  try {
    await prisma.unit.delete({ where: { id } });
    return { success: true, message: "Unit deleted successfully" };
  } catch (error) {
    console.error("Delete unit error:", error);
    return { success: false, message: "Failed to delete unit" };
  }
}
