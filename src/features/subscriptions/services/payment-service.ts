import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { RecordPaymentSchema } from "../schemas";
import type { PaymentWithRelations } from "../types";

export async function recordPayment(
  data: RecordPaymentSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: data.subscriptionId,
        amount: new Prisma.Decimal(data.amount),
        method: data.method || null,
        reference: data.reference || null,
      },
    });

    return {
      success: true,
      message: "Payment recorded successfully",
      data: { id: payment.id },
    };
  } catch (error) {
    console.error("Record payment error:", error);
    return { success: false, message: "Failed to record payment" };
  }
}

export async function getPayments(
  subscriptionId: string,
): Promise<PaymentWithRelations[]> {
  return prisma.subscriptionPayment.findMany({
    where: { subscriptionId },
    include: {
      subscription: {
        select: { id: true, plan: { select: { name: true } } },
      },
    },
    orderBy: { paidAt: "desc" },
  }) as unknown as PaymentWithRelations[];
}

export async function getAllPayments(filters?: {
  fromDate?: string;
  toDate?: string;
  method?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.fromDate || filters?.toDate) {
    where.paidAt = {};
    if (filters.fromDate)
      (where.paidAt as Record<string, unknown>).gte = new Date(filters.fromDate);
    if (filters.toDate)
      (where.paidAt as Record<string, unknown>).lte = new Date(filters.toDate);
  }
  if (filters?.method) where.method = filters.method;

  return prisma.subscriptionPayment.findMany({
    where,
    include: {
      subscription: {
        select: {
          id: true,
          plan: { select: { name: true } },
          business: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });
}
