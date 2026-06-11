import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePaymentMethodSchema, UpdatePaymentMethodSchema } from "../schemas";
import type { PaymentMethodWithCount } from "../types";

export async function createPaymentMethod(
  data: CreatePaymentMethodSchema,
): Promise<ActionResponse & { data?: PaymentMethodWithCount }> {
  try {
    const existing = await prisma.paymentMethod.findUnique({
      where: { businessId_name: { businessId: data.businessId, name: data.name } },
    });

    if (existing) {
      return { success: false, message: "Payment method with this name already exists" };
    }

    const method = await prisma.paymentMethod.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        type: data.type,
      },
    });

    return {
      success: true,
      message: "Payment method created",
      data: method as PaymentMethodWithCount,
    };
  } catch (error) {
    console.error("Create payment method error:", error);
    return { success: false, message: "Failed to create payment method" };
  }
}

export async function updatePaymentMethod(
  id: string,
  data: UpdatePaymentMethodSchema,
): Promise<ActionResponse & { data?: PaymentMethodWithCount }> {
  try {
    const method = await prisma.paymentMethod.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: "Payment method updated",
      data: method as PaymentMethodWithCount,
    };
  } catch (error) {
    console.error("Update payment method error:", error);
    return { success: false, message: "Failed to update payment method" };
  }
}

export async function getPaymentMethod(id: string) {
  return prisma.paymentMethod.findUnique({ where: { id } });
}

export async function getBusinessPaymentMethods(
  businessId: string,
  includeInactive?: boolean,
): Promise<PaymentMethodWithCount[]> {
  const methods = await prisma.paymentMethod.findMany({
    where: {
      businessId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: { _count: { select: { payments: true } } },
    orderBy: { name: "asc" },
  });

  return methods as unknown as PaymentMethodWithCount[];
}

export async function deletePaymentMethod(id: string): Promise<ActionResponse> {
  try {
    const paymentCount = await prisma.payment.count({ where: { paymentMethodId: id } });
    if (paymentCount > 0) {
      return {
        success: false,
        message: "Cannot delete payment method with existing payments. Deactivate it instead.",
      };
    }

    await prisma.paymentMethod.delete({ where: { id } });
    return { success: true, message: "Payment method deleted" };
  } catch (error) {
    console.error("Delete payment method error:", error);
    return { success: false, message: "Failed to delete payment method" };
  }
}
