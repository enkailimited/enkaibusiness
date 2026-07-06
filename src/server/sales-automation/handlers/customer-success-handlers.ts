import "server-only";
import { prisma } from "@/server/db";
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { dispatch } from "@/features/notifications/services/dispatch-service";

async function findCSMForBusiness(): Promise<string | null> {
  const csmHierarchy = await prisma.salesHierarchy.findFirst({
    where: { slug: { in: ["customer-success", "csm", "customer-success-manager"] } },
  });
  if (!csmHierarchy) return null;

  const where: Record<string, unknown> = {
    hierarchyId: csmHierarchy.id,
    status: "ACTIVE",
  };

  const csms = await prisma.salesProfile.findMany({
    where,
    include: {
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const withLoads = await Promise.all(
    csms.map(async (csm) => {
      const assignedCount = await prisma.lead.count({
        where: { assignedToId: csm.id, status: { notIn: ["CONVERTED", "LOST"] } },
      });
      return { ...csm, load: assignedCount };
    }),
  );

  withLoads.sort((a, b) => a.load - b.load);
  return withLoads[0]?.id ?? null;
}

async function findSalesRepForBusiness(businessId: string): Promise<{ id: string; userId: string; name: string } | null> {
  const lead = await prisma.lead.findFirst({
    where: {
      assignments: {
        some: {
          assignedTo: { leads: { some: { id: businessId } } },
        },
      },
    },
    orderBy: { convertedAt: "desc" },
    include: {
      assignedTo: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });
  if (lead?.assignedTo) {
    return {
      id: lead.assignedTo.id,
      userId: lead.assignedTo.userId,
      name: `${lead.assignedTo.user.firstName} ${lead.assignedTo.user.lastName}`,
    };
  }
  return null;
}

export function registerCustomerSuccessAutomation(): void {
  firdausEventBus.on("BusinessActivated", async (event) => {
    try {
      const businessId = event.businessId;
      if (!businessId) return;

      const csmProfileId = await findCSMForBusiness();
      if (!csmProfileId) return;

      const csmProfile = await prisma.salesProfile.findUnique({
        where: { id: csmProfileId },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
      if (!csmProfile) return;

      const rep = await findSalesRepForBusiness(businessId);
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true },
      });

      await prisma.leadActivity.create({
        data: {
          leadId: businessId,
          action: "CSM_ASSIGNED",
          detail: `Customer Success Manager ${csmProfile.user.firstName} ${csmProfile.user.lastName} assigned`,
          createdById: event.userId,
        },
      }).catch(() => {});

      const { emitCustomerSuccessAssigned } = await import("@/modules/ai/events/event-bus");
      emitCustomerSuccessAssigned(businessId, csmProfile.user.id, csmProfileId, {
        businessId,
        businessName: business?.name ?? "",
        previousOwnerId: rep?.userId ?? "",
        previousOwnerName: rep?.name ?? "",
      });

      await dispatch({
        userId: csmProfile.user.id,
        businessId,
        title: "New Customer Assigned",
        message: `You have been assigned as Customer Success Manager for ${business?.name ?? "a new business"}. Please initiate onboarding.`,
        type: "info",
        channels: ["in_app", "email"],
        referenceType: "business",
        referenceId: businessId,
      });

      if (rep) {
        await dispatch({
          userId: rep.userId,
          businessId,
          title: "Customer Transferred to CSM",
          message: `${business?.name ?? "Your client"} has been transferred to Customer Success (${csmProfile.user.firstName} ${csmProfile.user.lastName}). You retain acquisition credit.`,
          type: "info",
          channels: ["in_app"],
          referenceType: "business",
          referenceId: businessId,
        });
      }
    } catch {}
  });

  firdausEventBus.on("SubscriptionExpiring", async (event) => {
    try {
      const businessId = event.businessId;
      if (!businessId) return;

      const csmHierarchy = await prisma.salesHierarchy.findFirst({
        where: { slug: { in: ["customer-success", "csm", "customer-success-manager"] } },
      });
      if (!csmHierarchy) return;

      const csmProfiles = await prisma.salesProfile.findMany({
        where: { hierarchyId: csmHierarchy.id, status: "ACTIVE" },
        include: { user: { select: { id: true, email: true } } },
        take: 3,
      });

      for (const csm of csmProfiles) {
        await dispatch({
          userId: csm.user.id,
          businessId,
          title: "Subscription Expiring Soon",
          message: `Business subscription is expiring. Please reach out to discuss renewal.`,
          type: "warning",
          channels: ["in_app", "email"],
          referenceType: "subscription",
          referenceId: event.entityId,
        });
      }
    } catch {}
  });

  firdausEventBus.on("SubscriptionCancelled", async (event) => {
    try {
      const businessId = event.businessId;
      if (!businessId) return;

      const csmHierarchy = await prisma.salesHierarchy.findFirst({
        where: { slug: { in: ["customer-success", "csm", "customer-success-manager"] } },
      });
      if (!csmHierarchy) return;

      const csms = await prisma.salesProfile.findMany({
        where: { hierarchyId: csmHierarchy.id, status: "ACTIVE" },
        include: { user: { select: { id: true } } },
        take: 3,
      });

      for (const csm of csms) {
        await dispatch({
          userId: csm.user.id,
          businessId,
          title: "Subscription Cancelled",
          message: `A customer's subscription has been cancelled. Please follow up for retention.`,
          type: "alert",
          channels: ["in_app"],
          referenceType: "subscription",
          referenceId: event.entityId,
        });
      }
    } catch {}
  });
}
