import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSessionSchema, CloseSessionSchema, POSSessionFilterSchema } from "../schemas";
import type { POSSessionWithStaff } from "../types";

export async function openSession(
  data: CreateSessionSchema,
  businessId: string,
  openedById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existing = await prisma.pOSSession.findFirst({
      where: { businessId, status: "open" },
    });

    if (existing) {
      return { success: false, message: "An open session already exists. Close it before opening a new one." };
    }

    const session = await prisma.pOSSession.create({
      data: {
        businessId,
        storeId: data.storeId || null,
        openedById,
        openingFloat: data.openingFloat,
        status: "open",
      },
    });

    return {
      success: true,
      message: "POS session opened successfully",
      data: { id: session.id },
    };
  } catch (error) {
    console.error("Open session error:", error);
    return { success: false, message: "Failed to open POS session" };
  }
}

export async function closeSession(
  id: string,
  data: CloseSessionSchema,
  closedById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const session = await prisma.pOSSession.findUnique({ where: { id } });
    if (!session) return { success: false, message: "Session not found" };
    if (session.status === "closed") {
      return { success: false, message: "Session is already closed" };
    }

    const expectedAmount = Number(session.openingFloat);
    const actualAmount = data.closingFloat;
    const difference = actualAmount - expectedAmount;

    await prisma.pOSSession.update({
      where: { id },
      data: {
        closedById,
        closedAt: new Date(),
        closingFloat: data.closingFloat,
        expectedAmount,
        actualAmount,
        difference,
        status: "closed",
      },
    });

    return {
      success: true,
      message: "POS session closed successfully",
      data: { id },
    };
  } catch (error) {
    console.error("Close session error:", error);
    return { success: false, message: "Failed to close POS session" };
  }
}

export async function getSession(id: string): Promise<POSSessionWithStaff | null> {
  const raw = await prisma.pOSSession.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true } },
      openedBy: { select: { id: true, firstName: true, lastName: true } },
      closedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    openedAt: raw.openedAt.toISOString(),
    closedAt: raw.closedAt?.toISOString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    openingFloat: Number(raw.openingFloat),
    closingFloat: raw.closingFloat ? Number(raw.closingFloat) : null,
    expectedAmount: raw.expectedAmount ? Number(raw.expectedAmount) : null,
    actualAmount: raw.actualAmount ? Number(raw.actualAmount) : null,
    difference: raw.difference ? Number(raw.difference) : null,
  } as unknown as POSSessionWithStaff;
}

export async function getBusinessSessions(
  businessId: string,
  filter?: POSSessionFilterSchema,
): Promise<POSSessionWithStaff[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.storeId) where.storeId = filter.storeId;
  if (filter?.status) where.status = filter.status;

  if (filter?.dateFrom || filter?.dateTo) {
    where.openedAt = {};
    if (filter.dateFrom) where.openedAt.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.openedAt.lte = new Date(filter.dateTo);
  }

  const take = filter?.limit ?? 20;
  const skip = ((filter?.page ?? 1) - 1) * take;

  const raw = await prisma.pOSSession.findMany({
    where,
    include: {
      store: { select: { id: true, name: true } },
      openedBy: { select: { id: true, firstName: true, lastName: true } },
      closedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { openedAt: "desc" },
    skip,
    take,
  });

  return raw.map((s) => ({
    ...s,
    openedAt: s.openedAt.toISOString(),
    closedAt: s.closedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    openingFloat: Number(s.openingFloat),
    closingFloat: s.closingFloat ? Number(s.closingFloat) : null,
    expectedAmount: s.expectedAmount ? Number(s.expectedAmount) : null,
    actualAmount: s.actualAmount ? Number(s.actualAmount) : null,
    difference: s.difference ? Number(s.difference) : null,
  })) as unknown as POSSessionWithStaff[];
}
