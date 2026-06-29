import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePaymentSchema, PaymentFilterSchema } from "../schemas";
import type { PaymentWithRelations } from "../types";
import { recordCashTransaction } from "@/features/cash-management/services/cash-integration";

const paymentInclude = {
  paymentMethod: { select: { id: true, name: true, type: true } },
  customer: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

export async function createPayment(
  data: CreatePaymentSchema,
): Promise<ActionResponse & { data?: PaymentWithRelations }> {
  try {
    const refs = [
      data.saleId,
      data.invoiceId,
      data.customerCreditTxId,
      data.subscriptionId,
      data.purchaseId,
      data.expenseId,
    ].filter(Boolean);

    if (refs.length > 1) {
      return { success: false, message: "At most one polymorphic reference can be set" };
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          businessId: data.businessId,
          workspaceId: data.workspaceId,
          branchId: data.branchId,
          storeId: data.storeId,
          paymentMethodId: data.paymentMethodId,
          customerId: data.customerId,
          amount: data.amount,
          reference: data.reference,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
          status: data.status ?? "completed",
          notes: data.notes,
          saleId: data.saleId,
          invoiceId: data.invoiceId,
          customerCreditTxId: data.customerCreditTxId,
          subscriptionId: data.subscriptionId,
          purchaseId: data.purchaseId,
          expenseId: data.expenseId,
          createdById: data.createdById,
        },
        include: paymentInclude,
      });

      if (data.paymentMethodId && (data.status ?? "completed") === "completed") {
        const pm = await tx.paymentMethod.findUnique({
          where: { id: data.paymentMethodId },
          select: { type: true },
        });
        if (pm?.type === "cash") {
          await recordCashTransaction(
            tx,
            data.businessId,
            data.branchId ?? null,
            "cash_in",
            data.amount,
            p.reference || p.id,
            `Cash payment ${p.reference || p.id}`,
          );
        }
      }

      return p;
    });

    return {
      success: true,
      message: "Payment recorded",
      data: { ...payment, amount: Number(payment.amount) } as PaymentWithRelations,
    };
  } catch (error) {
    console.error("Create payment error:", error);
    return { success: false, message: "Failed to create payment" };
  }
}

export async function getPayment(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: paymentInclude,
  });

  if (!payment) return null;

  return { ...payment, amount: Number(payment.amount) } as PaymentWithRelations;
}

export async function listPayments(
  filter: PaymentFilterSchema,
): Promise<PaymentWithRelations[]> {
  const where: Record<string, unknown> = {
    businessId: filter.businessId,
  };

  if (filter.branchId) where.branchId = filter.branchId;
  if (filter.storeId) where.storeId = filter.storeId;
  if (filter.paymentMethodId) where.paymentMethodId = filter.paymentMethodId;
  if (filter.status) where.status = filter.status;
  if (filter.customerId) where.customerId = filter.customerId;

  if (filter.referenceType) {
    const refMap: Record<string, string> = {
      sale: "saleId",
      invoice: "invoiceId",
      credit: "customerCreditTxId",
      subscription: "subscriptionId",
      purchase: "purchaseId",
      expense: "expenseId",
    };
    const field = refMap[filter.referenceType];
    if (field) {
      where[field] = { not: null };
    }
  }

  if (filter.startDate || filter.endDate) {
    const paidAt: Record<string, Date> = {};
    if (filter.startDate) paidAt.gte = new Date(filter.startDate);
    if (filter.endDate) paidAt.lte = new Date(filter.endDate);
    where.paidAt = paidAt;
  }

  const payments = await prisma.payment.findMany({
    where,
    include: paymentInclude,
    orderBy: { paidAt: "desc" },
  });

  return payments.map((p) => ({ ...p, amount: Number(p.amount) })) as PaymentWithRelations[];
}

export async function voidPayment(
  id: string,
): Promise<ActionResponse & { data?: PaymentWithRelations }> {
  try {
    const existing = await prisma.payment.findUnique({
      where: { id },
      select: { id: true, status: true, amount: true, invoiceId: true, purchaseId: true, saleId: true, businessId: true, paymentMethodId: true, branchId: true },
    });

    if (!existing) {
      return { success: false, message: "Payment not found" };
    }

    if (existing.status === "refunded") {
      return { success: false, message: "Payment is already refunded" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: { status: "refunded" },
      });

      if (existing.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: existing.invoiceId },
          select: { id: true, total: true, paidAmount: true, status: true, dueDate: true },
        });
        if (invoice) {
          const refundAmount = Number(existing.amount);
          const newPaid = Math.max(0, Number(invoice.paidAmount) - refundAmount);
          const newBalance = Number(invoice.total) - newPaid;
          const now = new Date();
          let status: string;
          if (newBalance <= 0) status = "paid";
          else if (newPaid <= 0) status = "unpaid";
          else if (invoice.dueDate && invoice.dueDate < now) status = "overdue";
          else status = "partial";

          await tx.invoice.update({
            where: { id: invoice.id },
            data: { paidAmount: newPaid, balanceDue: newBalance, status },
          });
        }
      }

      if (existing.purchaseId) {
        const purchase = await tx.purchase.findUnique({
          where: { id: existing.purchaseId },
          select: { id: true, total: true, paidAmount: true, status: true, dueDate: true },
        });
        if (purchase) {
          const refundAmount = Number(existing.amount);
          const newPaid = Math.max(0, Number(purchase.paidAmount) - refundAmount);
          const newBalance = Number(purchase.total) - newPaid;
          const now = new Date();
          let status: string;
          if (newBalance <= 0) status = "paid";
          else if (newPaid <= 0) status = "unpaid";
          else if (purchase.dueDate && purchase.dueDate < now) status = "overdue";
          else status = "partial";

          await tx.purchase.update({
            where: { id: purchase.id },
            data: { paidAmount: newPaid, balanceDue: newBalance, status },
          });
        }
      }

      if (existing.paymentMethodId) {
        const pm = await tx.paymentMethod.findUnique({
          where: { id: existing.paymentMethodId },
          select: { type: true },
        });
        if (pm?.type === "cash") {
          await recordCashTransaction(
            tx,
            existing.businessId,
            existing.branchId ?? null,
            "cash_out",
            Number(existing.amount),
            existing.id,
            `Reversal: voided payment ${existing.id}`,
          );
        }
      }
    });

    return {
      success: true,
      message: "Payment refunded",
      data: undefined,
    };
  } catch (error) {
    console.error("Void payment error:", error);
    return { success: false, message: "Failed to void payment" };
  }
}

export async function getPaymentsForReference(
  referenceType: string,
  referenceId: string,
): Promise<PaymentWithRelations[]> {
  const refMap: Record<string, string> = {
    sale: "saleId",
    invoice: "invoiceId",
    credit: "customerCreditTxId",
    subscription: "subscriptionId",
    purchase: "purchaseId",
    expense: "expenseId",
  };

  const field = refMap[referenceType];
  if (!field) return [];

  const payments = await prisma.payment.findMany({
    where: { [field]: referenceId },
    include: paymentInclude,
    orderBy: { paidAt: "desc" },
  });

  return payments.map((p) => ({ ...p, amount: Number(p.amount) })) as PaymentWithRelations[];
}
