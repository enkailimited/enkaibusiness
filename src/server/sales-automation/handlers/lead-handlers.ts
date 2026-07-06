import "server-only";
import { prisma } from "@/server/db";
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { dispatch } from "@/features/notifications/services/dispatch-service";

const LEAD_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["INTERESTED", "LOST"],
  INTERESTED: ["DEMO", "LOST"],
  DEMO: ["NEGOTIATION", "LOST"],
  NEGOTIATION: ["CONVERTED", "LOST"],
  CONVERTED: [],
  LOST: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return (LEAD_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export function registerLeadAutomation(): void {
  firdausEventBus.on("LeadCreated", async (event) => {
    try {
      const { firstName, lastName, createdById, duplicateCount } = event.data as Record<string, string>;

      if (Number(duplicateCount) > 0 && createdById) {
        await dispatch({
          userId: createdById,
          businessId: event.businessId,
          title: "Duplicate Lead Warning",
          message: `Lead "${firstName} ${lastName}" may be a duplicate. ${duplicateCount} existing lead(s) found with same email/phone.`,
          type: "warning",
          channels: ["in_app"],
          referenceType: "lead",
          referenceId: event.entityId,
        });
      }

      const profile = await prisma.salesProfile.findUnique({ where: { userId: createdById } });
      if (profile?.managerId) {
        const manager = await prisma.salesProfile.findUnique({
          where: { id: profile.managerId },
          select: { userId: true },
        });
        if (manager) {
          await dispatch({
            userId: manager.userId,
            businessId: event.businessId,
            title: "New Lead Created",
            message: `${firstName} ${lastName} was created by your team member.`,
            type: "info",
            channels: ["in_app"],
            referenceType: "lead",
            referenceId: event.entityId,
          });
        }
      }
    } catch {}
  });

  firdausEventBus.on("LeadAssigned", async (event) => {
    try {
      const { assignedToUserId, leadName } = event.data as Record<string, string>;
      if (!assignedToUserId) return;

      await dispatch({
        userId: assignedToUserId,
        businessId: event.businessId,
        title: "New Lead Assigned",
        message: `Lead "${leadName ?? "Unnamed"}" has been assigned to you.`,
        type: "info",
        channels: ["in_app", "email"],
        referenceType: "lead",
        referenceId: event.entityId,
      });
    } catch {}
  });

  firdausEventBus.on("LeadTransferred", async (event) => {
    try {
      const { fromUserId, toUserId, leadName } = event.data as Record<string, string>;
      if (toUserId) {
        await dispatch({
          userId: toUserId,
          businessId: event.businessId,
          title: "Lead Transferred To You",
          message: `Lead "${leadName ?? "Unnamed"}" has been transferred to you.`,
          type: "info",
          channels: ["in_app"],
          referenceType: "lead",
          referenceId: event.entityId,
        });
      }
      if (fromUserId && fromUserId !== toUserId) {
        await dispatch({
          userId: fromUserId,
          businessId: event.businessId,
          title: "Lead Transferred Away",
          message: `Lead "${leadName ?? "Unnamed"}" has been transferred from you.`,
          type: "info",
          channels: ["in_app"],
          referenceType: "lead",
          referenceId: event.entityId,
        });
      }
    } catch {}
  });

  firdausEventBus.on("LeadConverted", async (event) => {
    try {
      const { assignedToUserId, leadName } = event.data as Record<string, string>;
      if (assignedToUserId) {
        await dispatch({
          userId: assignedToUserId,
          businessId: event.businessId,
          title: "Lead Converted!",
          message: `Congratulations! Lead "${leadName ?? "Unnamed"}" has been converted. Proceed with registration.`,
          type: "success",
          channels: ["in_app", "email"],
          referenceType: "lead",
          referenceId: event.entityId,
        });
      }

      const profile = await prisma.salesProfile.findUnique({ where: { userId: assignedToUserId } });
      if (profile?.managerId) {
        const manager = await prisma.salesProfile.findUnique({
          where: { id: profile.managerId },
          select: { userId: true },
        });
        if (manager) {
          await dispatch({
            userId: manager.userId,
            businessId: event.businessId,
            title: "Lead Converted by Team",
            message: `A team member converted lead "${leadName ?? "Unnamed"}".`,
            type: "info",
            channels: ["in_app"],
            referenceType: "lead",
            referenceId: event.entityId,
          });
        }
      }
    } catch {}
  });

  firdausEventBus.on("LeadLost", async (event) => {
    try {
      const { assignedToUserId, leadName, lostReason } = event.data as Record<string, string>;
      if (assignedToUserId) {
        await dispatch({
          userId: assignedToUserId,
          businessId: event.businessId,
          title: "Lead Lost",
          message: `Lead "${leadName ?? "Unnamed"}" was lost.${lostReason ? ` Reason: ${lostReason}` : ""}`,
          type: "warning",
          channels: ["in_app"],
          referenceType: "lead",
          referenceId: event.entityId,
        });
      }
    } catch {}
  });
}