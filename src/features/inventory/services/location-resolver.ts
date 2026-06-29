import "server-only";

import { prisma } from "@/server/db";

export async function resolveInventoryLocation(
  businessId: string,
  branchId?: string | null,
): Promise<{ id: string; name: string; branchId: string | null } | null> {
  if (branchId) {
    const location = await prisma.inventoryLocation.findFirst({
      where: { businessId, branchId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, branchId: true },
    });
    if (location) return location;

    const fallback = await prisma.inventoryLocation.findFirst({
      where: { businessId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, branchId: true },
    });
    if (fallback) return fallback;

    return prisma.inventoryLocation.create({
      data: {
        businessId,
        branchId,
        name: "Default Location",
        type: "branch",
      },
      select: { id: true, name: true, branchId: true },
    });
  }

  const location = await prisma.inventoryLocation.findFirst({
    where: { businessId, branchId: null, isActive: true, type: "business" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, branchId: true },
  });
  if (location) return location;

  return prisma.inventoryLocation.create({
    data: {
      businessId,
      name: "Main Store",
      type: "business",
    },
    select: { id: true, name: true, branchId: true },
  });
}
