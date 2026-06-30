import "server-only";

import { prisma } from "@/server/db";
import { createAuditLog } from "@/server/services/audit-service";
import { getBusinessSetting } from "@/features/businesses/services/setting-service";
import { createNotification, createBulkNotifications } from "@/features/notifications/services/notification-service";
import type { ActionResponse } from "@/types/relationships";
import { SubscriptionStatus } from "@prisma/client";
import { emitBusinessActivated, emitWalletFunded } from "@/modules/ai/events/event-bus";

export interface ActivationInfo {
  businessId: string;
  businessName: string;
  status: string;
  planName: string | null;
  planId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  walletBalance: number;
  setupFee: number;
  totalDeposited: number;
  hasPendingRequest: boolean;
  pendingRequestAmount: number | null;
  pendingRequestId: string | null;
  lastPaymentProof: string | null;
}

export async function getActivationInfo(businessId: string): Promise<ActivationInfo | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: { select: { name: true, id: true } } },
      },
      subscriptionWallets: { take: 1 },
      walletDepositRequests: {
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!business) return null;

  const subscription = business.subscriptions[0] ?? null;
  const wallet = business.subscriptionWallets[0] ?? null;
  const pendingRequest = business.walletDepositRequests[0] ?? null;
  const setupFee = Number(await getBusinessSetting(businessId, "setup_fee") ?? "0");

  return {
    businessId: business.id,
    businessName: business.name,
    status: business.status,
    planName: subscription?.plan?.name ?? null,
    planId: subscription?.plan?.id ?? null,
    subscriptionId: subscription?.id ?? null,
    subscriptionStatus: subscription?.status ?? null,
    walletBalance: wallet ? Number(wallet.balance) : 0,
    setupFee,
    totalDeposited: wallet ? Number(wallet.totalDeposited) : 0,
    hasPendingRequest: !!pendingRequest,
    pendingRequestAmount: pendingRequest ? Number(pendingRequest.amount) : null,
    pendingRequestId: pendingRequest?.id ?? null,
    lastPaymentProof: pendingRequest?.paymentProof ?? null,
  };
}

export async function getBusinessesPendingActivation() {
  const businesses = await prisma.business.findMany({
    where: { status: "PENDING_SETUP" },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: { select: { name: true, amount: true, interval: true } } },
      },
      subscriptionWallets: { take: 1 },
      walletDepositRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return businesses.map((b) => {
    const sub = b.subscriptions[0] ?? null;
    const wallet = b.subscriptionWallets[0] ?? null;
    const depositReq = b.walletDepositRequests[0] ?? null;
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      email: b.email,
      phone: b.phone,
      createdAt: b.createdAt,
      status: b.status,
      planName: sub?.plan?.name ?? null,
      planAmount: sub?.plan ? Number(sub.plan.amount) : null,
      planInterval: sub?.plan?.interval ?? null,
      subscriptionStatus: sub?.status ?? null,
      walletBalance: wallet ? Number(wallet.balance) : 0,
      totalDeposited: wallet ? Number(wallet.totalDeposited) : 0,
      depositStatus: depositReq?.status ?? null,
      depositAmount: depositReq ? Number(depositReq.amount) : null,
      paymentProof: depositReq?.paymentProof ?? null,
      depositReference: depositReq?.reference ?? null,
      ownerName: b.createdBy ? `${b.createdBy.firstName} ${b.createdBy.lastName}` : null,
      ownerEmail: b.createdBy?.email ?? null,
    };
  });
}

export async function submitWalletTopUp(
  businessId: string,
  userId: string,
  amount: number,
  reference: string,
  description?: string,
  paymentProof?: string,
): Promise<ActionResponse> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { status: true, name: true },
    });
    if (!business) return { success: false, message: "Business not found" };

    const existing = await prisma.walletDepositRequest.findFirst({
      where: { businessId, status: "pending" },
    });
    if (existing) {
      return { success: false, message: "A pending top-up request already exists. Please wait for it to be processed." };
    }

    const req = await prisma.walletDepositRequest.create({
      data: {
        businessId,
        amount,
        reference,
        description: description ?? `Wallet top-up for ${business.name}`,
        paymentProof,
        status: "pending",
        requestedById: userId,
      },
    });

    await createAuditLog(userId, "WALLET_TOPUP", "WalletDepositRequest", req.id, {
      after: { businessId, amount: amount, reference, status: "pending" },
    });

    const adminRoles = await prisma.userRole.findMany({
      where: {
        businessId: null,
        role: { slug: { in: ["super-admin", "admin", "finance-officer"] } },
      },
      select: { userId: true },
    });
    const adminIds = [...new Set(adminRoles.map((r) => r.userId))];
    if (adminIds.length > 0) {
      await createBulkNotifications(adminIds, {
        title: "New Top-Up Request",
        message: `${business.name} submitted a top-up request of ${amount} TZS`,
        type: "payment",
        referenceType: "WalletDepositRequest",
        referenceId: req.id,
      });
    }

    return { success: true, message: "Top-up request submitted. Awaiting administrator approval." };
  } catch (error) {
    console.error("Wallet top-up error:", error);
    return { success: false, message: "Failed to submit top-up request" };
  }
}

export async function approveTopUp(
  requestId: string,
  adminId: string,
  notes?: string,
): Promise<ActionResponse> {
  try {
    const request = await prisma.walletDepositRequest.findUnique({
      where: { id: requestId },
      include: {
        business: {
          select: { id: true, name: true, status: true },
        },
      },
    });
    if (!request) return { success: false, message: "Deposit request not found" };
    if (request.status !== "pending") return { success: false, message: "Request is not pending" };

    const result = await prisma.$transaction(async (tx) => {
      await tx.walletDepositRequest.update({
        where: { id: requestId },
        data: { status: "approved", reviewedById: adminId, reviewedAt: new Date(), notes },
      });

      let wallet = await tx.subscriptionWallet.findUnique({ where: { businessId: request.businessId } });
      if (!wallet) {
        wallet = await tx.subscriptionWallet.create({
          data: { businessId: request.businessId },
        });
      }

      const amount = Number(request.amount);
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await tx.subscriptionWallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalDeposited: Number(wallet.totalDeposited) + amount,
        },
      });

      await tx.subscriptionTransaction.create({
        data: {
          walletId: wallet.id,
          type: "deposit",
          amount,
          balanceBefore,
          balanceAfter,
          reference: request.reference ?? undefined,
          description: `Deposit approved (${request.reference ?? "manual"})`,
        },
      });

      await tx.payment.create({
        data: {
          businessId: request.businessId,
          amount,
          reference: request.reference ?? `DEP-${requestId.slice(0, 8)}`,
          status: "completed",
          paidAt: new Date(),
          createdById: adminId,
        },
      });

      const setupFee = Number(await getBusinessSetting(request.businessId, "setup_fee") ?? "0");
      let activated = false;

      if (balanceAfter >= setupFee && request.business.status === "PENDING_SETUP") {
        const subscription = await tx.subscription.findFirst({
          where: { businessId: request.businessId, status: SubscriptionStatus.PENDING },
          orderBy: { createdAt: "desc" },
        });

        if (subscription) {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.ACTIVE },
          });

          await createAuditLog(adminId, "SUBSCRIPTION_ACTIVATED", "Subscription", subscription.id, {
            after: { status: SubscriptionStatus.ACTIVE, businessId: request.businessId },
          });
        }

        if (setupFee > 0) {
          const deductBalance = Number(wallet.balance) + amount;
          const afterDeduction = deductBalance - setupFee;

          await tx.subscriptionWallet.update({
            where: { id: wallet.id },
            data: {
              balance: afterDeduction,
              totalConsumed: Number(wallet.totalConsumed) + setupFee,
            },
          });

          await tx.subscriptionTransaction.create({
            data: {
              walletId: wallet.id,
              type: "consumption",
              amount: setupFee,
              balanceBefore: deductBalance,
              balanceAfter: afterDeduction,
              reference: "SETUP_FEE_DEDUCTION",
              description: "Setup fee deducted after approval",
            },
          });

          await tx.payment.create({
            data: {
              businessId: request.businessId,
              amount: setupFee,
              reference: `SETUP-${requestId.slice(0, 8)}`,
              status: "completed",
              paidAt: new Date(),
              createdById: adminId,
            },
          });
        }

        await tx.business.update({
          where: { id: request.businessId },
          data: { status: "ACTIVE", isActive: true },
        });

        activated = true;

        await createAuditLog(adminId, "BUSINESS_ACTIVATED", "Business", request.businessId, {
          after: { status: "ACTIVE", isActive: true },
        });
      }

      return { activated, setupFee };
    });

    await createAuditLog(adminId, "PAYMENT_APPROVED", "WalletDepositRequest", requestId, {
      after: { status: "approved", businessId: request.businessId, amount: Number(request.amount) },
    });

    emitWalletFunded(request.businessId, adminId, requestId, {
      amount: Number(request.amount),
    });

    if (result.activated) {
      emitBusinessActivated(request.businessId, adminId, request.businessId, {
        setupFee: result.setupFee,
        planName: request.business.name,
      });
    }

    await createNotification({
      userId: request.requestedById,
      title: result.activated ? "Payment Approved & Business Activated" : "Payment Approved",
      message: result.activated
        ? `Your payment of ${request.amount} TZS has been approved. Setup fee (${result.setupFee} TZS) deducted and business is now active.`
        : `Your payment of ${request.amount} TZS has been approved. Business still pending (insufficient funds for setup fee).`,
      type: "payment",
      referenceType: "WalletDepositRequest",
      referenceId: requestId,
    });

    return {
      success: true,
      message: result.activated
        ? `Payment approved. Business activated. Setup fee (${result.setupFee} TZS) deducted.`
        : "Payment approved. Wallet credited. Business still pending (insufficient funds for setup fee).",
    };
  } catch (error) {
    console.error("Approve top-up error:", error);
    return { success: false, message: "Failed to approve top-up" };
  }
}

export async function rejectTopUp(
  requestId: string,
  adminId: string,
  reason?: string,
): Promise<ActionResponse> {
  try {
    const request = await prisma.walletDepositRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return { success: false, message: "Deposit request not found" };
    if (request.status !== "pending") return { success: false, message: "Request is not pending" };

    await prisma.walletDepositRequest.update({
      where: { id: requestId },
      data: { status: "rejected", reviewedById: adminId, reviewedAt: new Date(), notes: reason },
    });

    await createAuditLog(adminId, "PAYMENT_REJECTED", "WalletDepositRequest", requestId, {
      after: { status: "rejected", reason },
    });

    await createNotification({
      userId: request.requestedById,
      title: "Top-Up Request Rejected",
      message: `Your top-up request of ${request.amount} TZS has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      type: "payment",
      referenceType: "WalletDepositRequest",
      referenceId: requestId,
    });

    return { success: true, message: "Top-up request rejected." };
  } catch (error) {
    console.error("Reject top-up error:", error);
    return { success: false, message: "Failed to reject top-up" };
  }
}

export async function suspendBusiness(
  businessId: string,
  adminId: string,
  reason?: string,
): Promise<ActionResponse> {
  try {
    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { status: true, name: true } });
    if (!business) return { success: false, message: "Business not found" };
    if (business.status === "SUSPENDED") return { success: false, message: "Business is already suspended" };

    await prisma.business.update({
      where: { id: businessId },
      data: { status: "SUSPENDED", isActive: false },
    });

    await createAuditLog(adminId, "BUSINESS_SUSPENDED", "Business", businessId, {
      before: { status: business.status, isActive: true },
      after: { status: "SUSPENDED", isActive: false },
    });

    const ownerRoles = await prisma.userRole.findMany({
      where: { businessId, role: { slug: { in: ["owner", "business-owner"] } } },
      select: { userId: true },
    });
    const ownerIds = [...new Set(ownerRoles.map((r) => r.userId))];
    if (ownerIds.length > 0) {
      await createBulkNotifications(ownerIds, {
        title: "Business Suspended",
        message: `Your business "${business.name}" has been suspended.${reason ? ` Reason: ${reason}` : ""}`,
        type: "warning",
        referenceType: "Business",
        referenceId: businessId,
      });
    }

    return { success: true, message: "Business suspended successfully." };
  } catch (error) {
    console.error("Suspend business error:", error);
    return { success: false, message: "Failed to suspend business" };
  }
}

export async function reactivateBusiness(
  businessId: string,
  adminId: string,
): Promise<ActionResponse> {
  try {
    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { status: true, name: true } });
    if (!business) return { success: false, message: "Business not found" };
    if (business.status !== "SUSPENDED") return { success: false, message: "Business is not suspended" };

    await prisma.business.update({
      where: { id: businessId },
      data: { status: "ACTIVE", isActive: true },
    });

    await createAuditLog(adminId, "BUSINESS_REACTIVATED", "Business", businessId, {
      before: { status: "SUSPENDED", isActive: false },
      after: { status: "ACTIVE", isActive: true },
    });

    const ownerRoles = await prisma.userRole.findMany({
      where: { businessId, role: { slug: { in: ["owner", "business-owner"] } } },
      select: { userId: true },
    });
    const ownerIds = [...new Set(ownerRoles.map((r) => r.userId))];
    if (ownerIds.length > 0) {
      await createBulkNotifications(ownerIds, {
        title: "Business Reactivated",
        message: `Your business "${business.name}" has been reactivated.`,
        type: "success",
        referenceType: "Business",
        referenceId: businessId,
      });
    }

    return { success: true, message: "Business reactivated successfully." };
  } catch (error) {
    console.error("Reactivate business error:", error);
    return { success: false, message: "Failed to reactivate business" };
  }
}

export async function getBusinessesForAdmin() {
  const businesses = await prisma.business.findMany({
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: { select: { name: true, amount: true, interval: true } } },
      },
      subscriptionWallets: { take: 1 },
      walletDepositRequests: {
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return businesses.map((b) => {
    const sub = b.subscriptions[0] ?? null;
    const wallet = b.subscriptionWallets[0] ?? null;
    const depositReq = b.walletDepositRequests[0] ?? null;

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      email: b.email,
      status: b.status,
      isActive: b.isActive,
      createdAt: b.createdAt,
      ownerName: b.createdBy ? `${b.createdBy.firstName} ${b.createdBy.lastName}` : null,
      ownerEmail: b.createdBy?.email ?? null,
      planName: sub?.plan?.name ?? null,
      planAmount: sub?.plan ? Number(sub.plan.amount) : null,
      planInterval: sub?.plan?.interval ?? null,
      subscriptionStatus: sub?.status ?? null,
      subscriptionId: sub?.id ?? null,
      walletBalance: wallet ? Number(wallet.balance) : 0,
      totalDeposited: wallet ? Number(wallet.totalDeposited) : 0,
      hasPendingDeposit: !!depositReq,
      pendingDepositAmount: depositReq ? Number(depositReq.amount) : null,
      pendingDepositId: depositReq?.id ?? null,
      pendingDepositReference: depositReq?.reference ?? null,
      pendingDepositProof: depositReq?.paymentProof ?? null,
    };
  });
}
