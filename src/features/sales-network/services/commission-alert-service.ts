import "server-only";

import { prisma } from "@/server/db";
import { dispatch } from "@/features/notifications/services/dispatch-service";

export async function handleBusinessRegistrationCommission(
  businessId: string,
  subscriptionId: string,
  salesProfileId?: string | null,
) {
  if (!salesProfileId) return;

  const profile = await prisma.salesProfile.findUnique({
    where: { id: salesProfileId },
    include: { user: true, hierarchy: true },
  });
  if (!profile) return;

  const rules = await prisma.commissionRule.findMany({
    where: {
      isActive: true,
      hierarchyLevelId: profile.hierarchyId ?? undefined,
    },
  });

  const rule = rules[0];
  if (!rule) return;

  const amount = 50000; // Default commission; replace with rule calculation

  await prisma.commissionLedger.create({
    data: {
      salesProfileId,
      subscriptionId,
      type: "ONE_TIME",
      amount,
      description: `Commission for business registration`,
      status: "PENDING",
    },
  });

  await dispatch({
    userId: profile.userId,
    title: "Hongera! Commission earned",
    message: `Umepata commission ya TZS ${amount.toLocaleString()} kutokana na usajili wa biashara mpya.`,
    type: "commission_earned",
    channels: ["in_app"],
  });
}
