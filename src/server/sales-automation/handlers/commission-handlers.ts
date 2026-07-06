import "server-only";

import { prisma } from "@/server/db";
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { calculateCommissionV2, getRulesForEvent } from "@/features/commissions/services/rule-service";
import { createEntry, cancelEntry, clawbackEntry } from "@/features/commissions/services/ledger-service";
import {
  createRecurringConfig,
  deactivateRecurringCommission,
  processRecurringCommission,
} from "@/features/commissions/services/recurring-commission-service";
import {
  emitCommissionClawedBack,
  emitRenewalCompleted,
} from "@/modules/ai/events/event-bus";

async function earnFromRules(
  salesProfileId: string,
  triggerEvent: string,
  amount: number,
  context: Record<string, unknown>,
  businessId: string,
  entityId?: string,
): Promise<void> {
  const result = await calculateCommissionV2(salesProfileId, triggerEvent, amount, {
    amount,
    ...context,
  } as any);

  if (!result || result.total <= 0) return;

  const profile = await prisma.salesProfile.findUnique({
    where: { id: salesProfileId },
    select: { userId: true },
  });
  if (!profile) return;

  for (const item of result.breakdown) {
    await createEntry({
      salesProfileId,
      amount: item.amount,
      type: item.calculationType === "FLAT" ? "FLAT" : "PERCENTAGE",
      description: `${item.ruleName}: ${item.description || triggerEvent} commission`,
      subscriptionId: (context.subscriptionId as string) || entityId,
    }, businessId);
  }
}

export function registerCommissionAutomation(): void {
  firdausEventBus.on("BusinessRegistered", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const amount = Number(data.planAmount || 0);
      const context = {
        industry: data.industry as string,
        businessModeId: data.businessModeId as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
        subscriptionId: event.entityId,
      };

      await earnFromRules(salesProfileId, "BUSINESS_REGISTRATION", amount, context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("SubscriptionActivated", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const setupFee = Number(data.setupFee || 0);
      const planAmount = Number(data.planAmount || 0);

      const context = {
        industry: data.industry as string,
        businessModeId: data.businessModeId as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
        subscriptionId: event.entityId,
      };

      if (setupFee > 0) {
        await earnFromRules(salesProfileId, "FIRST_PAYMENT", setupFee, context, event.businessId, event.entityId);
      }

      await earnFromRules(salesProfileId, "SUBSCRIPTION_ACTIVATION", planAmount, context, event.businessId, event.entityId);

      const activationRules = await getRulesForEvent("SUBSCRIPTION_ACTIVATION", context.industry, context.businessModeId, context.subscriptionPlanId);
      if (activationRules.length > 0) {
        const rule = activationRules[0]!;
        const meta = (rule.metadata || {}) as Record<string, unknown>;
        const recurringPct = (meta.recurringPercentage as number) || 0;
        if (recurringPct > 0) {
          await createRecurringConfig({
            salesProfileId,
            subscriptionId: event.entityId,
            ruleId: rule.id,
            percentage: recurringPct,
          });
        }
      }
    } catch {}
  });

  firdausEventBus.on("SubscriptionRenewed", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const amount = Number(data.amount || 0);
      if (amount <= 0) return;

      const profile = await prisma.salesProfile.findUnique({ where: { id: salesProfileId } });
      if (!profile) return;

      const context = {
        industry: data.industry as string,
        businessModeId: data.businessModeId as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
        subscriptionId: event.entityId,
      };

      const recurringResult = await processRecurringCommission(event.entityId, amount, event.businessId, profile.userId);
      if (recurringResult.success && recurringResult.data && recurringResult.data.entries.length > 0) {
        const entryId = recurringResult.data.entries[0];
        emitRenewalCompleted(event.businessId, profile.userId, event.entityId, {
          commissionId: entryId,
          amount,
          recurring: true,
        });
        return;
      }

      await earnFromRules(salesProfileId, "SUBSCRIPTION_RENEWAL", amount, context, event.businessId, event.entityId);

      const renewalEntry = await prisma.commissionLedger.findFirst({
        where: { subscriptionId: event.entityId, description: { contains: "SUBSCRIPTION_RENEWAL" } },
        orderBy: { createdAt: "desc" },
      });

      if (renewalEntry) {
        emitRenewalCompleted(event.businessId, profile.userId, event.entityId, {
          commissionId: renewalEntry.id,
          amount,
        });
      }
    } catch {}
  });

  firdausEventBus.on("ReferralCreated", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const referrerProfileId = data.referrerProfileId as string;
      if (!referrerProfileId) return;

      const amount = Number(data.planAmount || 0);
      const context = {
        industry: data.industry as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
        subscriptionId: event.entityId,
      };

      await earnFromRules(referrerProfileId, "REFERRAL", amount, context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("SubscriptionCancelled", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const subscriptionId = data.subscriptionId as string || event.entityId;
      if (!subscriptionId) return;

      await deactivateRecurringCommission(subscriptionId);

      const paidEntries = await prisma.commissionLedger.findMany({
        where: {
          subscriptionId,
          status: "PAID",
          amount: { gt: 0 },
        },
      });

      for (const entry of paidEntries) {
        const daysSincePaid = Math.floor(
          (Date.now() - new Date(entry.paidAt ?? entry.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSincePaid <= 90) {
          await clawbackEntry(entry.id, entry.salesProfileId, Number(entry.amount), `Subscription ${subscriptionId} cancelled within clawback window`);
          const profile = await prisma.salesProfile.findUnique({ where: { id: entry.salesProfileId } });
          if (profile) {
            emitCommissionClawedBack(event.businessId, profile.userId, entry.id, {
              subscriptionId,
              amount: Number(entry.amount),
            });
          }
        } else {
          await cancelEntry(entry.id, `Subscription ${subscriptionId} cancelled (outside clawback window)`);
        }
      }

      const pendingEntries = await prisma.commissionLedger.findMany({
        where: { subscriptionId, status: { in: ["PENDING", "APPROVED"] } },
      });
      for (const entry of pendingEntries) {
        await cancelEntry(entry.id, `Subscription ${subscriptionId} cancelled`);
      }
    } catch {}
  });

  firdausEventBus.on("InstallationCompleted", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;

      if (salesProfileId) {
        const context = {
          installationPackageId: data.installationPackageId as string,
          industry: data.industry as string,
        };
        await earnFromRules(salesProfileId, "INSTALLATION", Number(data.amount || 0), context, event.businessId, event.entityId);
        return;
      }

      const distributorId = data.distributorId as string;
      if (distributorId) {
        const distributor = await prisma.distributor.findUnique({ where: { id: distributorId } });
        if (distributor) {
          const salesProfile = await prisma.salesProfile.findUnique({ where: { userId: distributor.userId } });
          if (salesProfile) {
            const context = {
              installationPackageId: data.installationPackageId as string,
              industry: data.industry as string,
            };
            await earnFromRules(salesProfile.id, "INSTALLATION", Number(data.amount || 0), context, event.businessId, event.entityId);
          }
        }
      }
    } catch {}
  });

  firdausEventBus.on("TrainingCompleted", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        businessModeId: data.businessModeId as string,
      };

      await earnFromRules(salesProfileId, "TRAINING", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("QRActivated", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        businessModeId: data.businessModeId as string,
      };

      await earnFromRules(salesProfileId, "QR_ACTIVATION", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("BusinessExpanded", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        businessModeId: data.businessModeId as string,
        branchCount: Number(data.branchCount || 0),
        revenue: Number(data.revenue || 0),
      };

      await earnFromRules(salesProfileId, "BUSINESS_EXPANSION", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("BranchCreated", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        businessModeId: data.businessModeId as string,
        branchCount: Number(data.totalBranches || 0),
      };

      await earnFromRules(salesProfileId, "BRANCH_EXPANSION", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("AddonPurchased", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
        subscriptionId: event.entityId,
      };

      await earnFromRules(salesProfileId, "ADDON_PURCHASE", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("UpsellCompleted", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
        subscriptionId: event.entityId,
      };

      await earnFromRules(salesProfileId, "UPSELL", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("CrossSellCompleted", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
      };

      await earnFromRules(salesProfileId, "CROSS_SELL", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("CustomerRetentionMet", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        customerCount: Number(data.customerCount || 0),
        revenue: Number(data.revenue || 0),
      };

      await earnFromRules(salesProfileId, "CUSTOMER_RETENTION", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("CampaignBonusEvent", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      await earnFromRules(salesProfileId, "CAMPAIGN_BONUS", Number(data.amount || 0), {}, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("SeasonalBonusEvent", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      await earnFromRules(salesProfileId, "SEASONAL_BONUS", Number(data.amount || 0), {}, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("ReferralChainEvent", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        chainDepth: Number(data.chainDepth || 1),
        subscriptionPlanId: data.subscriptionPlanId as string,
      };

      await earnFromRules(salesProfileId, "REFERRAL_CHAIN", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("AnnualRenewalEvent", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        subscriptionPlanId: data.subscriptionPlanId as string,
        subscriptionId: event.entityId,
      };

      await earnFromRules(salesProfileId, "ANNUAL_RENEWAL", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });

  firdausEventBus.on("CustomerSuccessEvent", async (event) => {
    try {
      const data = event.data as Record<string, unknown>;
      const salesProfileId = data.salesProfileId as string;
      if (!salesProfileId) return;

      const context = {
        industry: data.industry as string,
        customerCount: Number(data.customerCount || 0),
        revenue: Number(data.revenue || 0),
      };

      await earnFromRules(salesProfileId, "CUSTOMER_SUCCESS", Number(data.amount || 0), context, event.businessId, event.entityId);
    } catch {}
  });
}
