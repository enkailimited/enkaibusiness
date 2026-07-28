import "server-only";
import { prisma } from "@/server/db";
// import { Prisma } from "@prisma/client";
import type { PayoutMethodType } from "@prisma/client";

export async function getPayoutMethods(salesProfileId: string) {
  return prisma.payoutMethod.findMany({
    where: { salesProfileId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createPayoutMethod(
  salesProfileId: string,
  type: PayoutMethodType,
  details: Record<string, unknown>,
  label?: string,
) {
  const profile = await prisma.salesProfile.findUnique({ where: { id: salesProfileId } });
  if (!profile) throw new Error("Sales profile not found");

  const existingCount = await prisma.payoutMethod.count({ where: { salesProfileId } });
  const isDefault = existingCount === 0;

  return prisma.payoutMethod.create({
    data: {
      salesProfileId,
      type,
      label: label || null,
      details: details as any,
      isDefault,
      isVerified: false,
    },
  });
}

export async function updatePayoutMethod(id: string, details: Record<string, unknown>) {
  const method = await prisma.payoutMethod.findUnique({ where: { id } });
  if (!method) throw new Error("Payout method not found");

  return prisma.payoutMethod.update({
    where: { id },
    data: { details: details as any },
  });
}

export async function deletePayoutMethod(id: string) {
  const method = await prisma.payoutMethod.findUnique({ where: { id } });
  if (!method) throw new Error("Payout method not found");

  if (method.isDefault) {
    await prisma.payoutMethod.delete({ where: { id } });
    const remaining = await prisma.payoutMethod.findFirst({
      where: { salesProfileId: method.salesProfileId },
      orderBy: { createdAt: "asc" },
    });
    if (remaining) {
      await prisma.payoutMethod.update({
        where: { id: remaining.id },
        data: { isDefault: true },
      });
    }
    return { success: true, message: "Payout method deleted, new default set" };
  }

  await prisma.payoutMethod.delete({ where: { id } });
  return { success: true, message: "Payout method deleted" };
}

export async function setDefaultMethod(salesProfileId: string, methodId: string) {
  const method = await prisma.payoutMethod.findUnique({ where: { id: methodId } });
  if (!method) throw new Error("Payout method not found");
  if (method.salesProfileId !== salesProfileId) throw new Error("Method does not belong to this sales profile");

  await prisma.$transaction([
    prisma.payoutMethod.updateMany({
      where: { salesProfileId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.payoutMethod.update({
      where: { id: methodId },
      data: { isDefault: true },
    }),
  ]);

  return { success: true, message: "Default payout method updated" };
}

export async function verifyPayoutMethod(id: string) {
  const method = await prisma.payoutMethod.findUnique({ where: { id } });
  if (!method) throw new Error("Payout method not found");

  return prisma.payoutMethod.update({
    where: { id },
    data: { isVerified: true },
  });
}

export async function getMethodsByType(type: PayoutMethodType) {
  return prisma.payoutMethod.findMany({
    where: { type },
    include: {
      salesProfile: {
        select: { id: true, userId: true, user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
