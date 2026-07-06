import "server-only";
import { prisma } from "@/server/db";
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { dispatch } from "@/features/notifications/services/dispatch-service";
import { SERVICE_TYPES_REQUIRING_TRAINING } from "@/server/enterprise/installation-packages/constants";


async function getBusinessOwnerUserId(businessId: string): Promise<string | null> {
  const staffAssignment = await prisma.staffAssignment.findFirst({
    where: {
      staff: { businessId },
      role: { slug: "owner" },
    },
    select: { staff: { select: { userId: true } } },
  });
  return staffAssignment?.staff.userId ?? null;
}

export function registerInstallationAutomation(): void {
  firdausEventBus.on("DistributorAssigned", async (event) => {
    try {
      const { installerId, ticketNumber, businessName } = event.data as Record<string, string>;

      const pkgLink = await prisma.installationTicketPackage.findUnique({
        where: { ticketId: event.entityId },
        select: { id: true, qrExperienceEnabled: true },
      });

      if (pkgLink) {
        await prisma.installationTicketPackage.update({
          where: { ticketId: event.entityId },
          data: { qrExperienceEnabled: false },
        });
      }

      const ticket = await prisma.installationTicket.findUnique({
        where: { id: event.entityId },
        select: {
          business: { select: { id: true, name: true, address: true } },
          branch: { select: { city: true } },
        },
      });

      if (installerId) {
        const installer = await prisma.installer.findUnique({
          where: { id: installerId },
          select: { userId: true, firstName: true },
        });
        if (installer) {
          await dispatch({
            userId: installer.userId,
            businessId: event.businessId,
            title: "Installation Assigned",
            message: `You have been assigned to install ${businessName ?? ticket?.business.name ?? "a business"} (Ticket: ${ticketNumber ?? event.entityId}). ${ticket?.business.address ? `Location: ${ticket.business.address}.` : ""} Please schedule a site visit.`,
            type: "info",
            channels: ["in_app", "email"],
            referenceType: "installation",
            referenceId: event.entityId,
          });
        }
      }

      const installerCity = ticket?.branch?.city;
      if (installerCity) {
        const localInstallers = await prisma.installer.findMany({
          where: {
            city: installerCity,
            status: "AVAILABLE",
            id: { not: installerId ?? "" },
          },
          select: { userId: true, firstName: true, lastName: true },
          take: 3,
        });
        for (const local of localInstallers) {
          await dispatch({
            userId: local.userId,
            businessId: event.businessId,
            title: "Installation Available Nearby",
            message: `An installation for ${ticket!.business.name} in ${installerCity} needs attention. Check your availability.`,
            type: "info",
            channels: ["in_app"],
            referenceType: "installation",
            referenceId: event.entityId,
          });
        }
      }
    } catch {}
  });

  firdausEventBus.on("InstallationStarted", async (event) => {
    try {
      const businessName = event.data.businessName as string | undefined;

      const ticket = await prisma.installationTicket.findUnique({
        where: { id: event.entityId },
        select: { installerId: true, ticketNumber: true },
      });

      if (ticket?.installerId) {
        const installer = await prisma.installer.findUnique({
          where: { id: ticket.installerId },
          select: { userId: true, gpsLat: true, gpsLng: true },
        });
        if (installer) {
          await prisma.installerTravelLog.create({
            data: {
              installerId: ticket.installerId,
              ticketId: event.entityId,
              status: "en_route",
              gpsLat: installer.gpsLat,
              gpsLng: installer.gpsLng,
              notes: "Installation started — en route",
            },
          });

          await prisma.installer.update({
            where: { id: ticket.installerId },
            data: { status: "TRAVELING", travelStatus: "traveling" },
          });

          await dispatch({
            userId: installer.userId,
            businessId: event.businessId,
            title: "Installation Started",
            message: `Installation for ${businessName ?? "this business"} (Ticket: ${ticket.ticketNumber}) is now in progress. Travel status has been updated.`,
            type: "info",
            channels: ["in_app"],
            referenceType: "installation",
            referenceId: event.entityId,
          });
        }
      }

      const ownerId = await getBusinessOwnerUserId(event.businessId);
      if (ownerId) {
        await dispatch({
          userId: ownerId,
          businessId: event.businessId,
          title: "Installation Started",
          message: `The installation for ${businessName ?? "your business"} has started. Track progress on your installation dashboard.`,
          type: "info",
          channels: ["in_app"],
          referenceType: "installation",
          referenceId: event.entityId,
        });
      }
    } catch {}
  });

  firdausEventBus.on("InstallationStepCompleted", async (event) => {
    try {
      const { step, distributorUserId } = event.data as Record<string, string>;

      if (step === "SITE_VISIT_SCHEDULED" && distributorUserId) {
        await dispatch({
          userId: distributorUserId,
          businessId: event.businessId,
          title: "Site Visit Scheduled",
          message: "Site visit confirmed. Please arrive on the scheduled date.",
          type: "info",
          channels: ["in_app"],
          referenceType: "installation",
          referenceId: event.entityId,
        });
      }

      if (step === "QR_INSTALLED") {
        const pkgLink = await prisma.installationTicketPackage.findUnique({
          where: { ticketId: event.entityId },
          select: { customerApproved: true, qrExperienceEnabled: true },
        });

        if (pkgLink && pkgLink.customerApproved && pkgLink.qrExperienceEnabled) {
          const { emitQRActivated } = await import("@/modules/ai/events/event-bus");
          emitQRActivated(event.businessId, event.userId, event.entityId, {
            ticketId: event.entityId,
            step: "qr_installed",
          });
        }
      }

      if (step === "QR_ACTIVATED") {
        const pkgLink = await prisma.installationTicketPackage.findUnique({
          where: { ticketId: event.entityId },
          select: { customerApproved: true },
        });

        if (pkgLink && pkgLink.customerApproved) {
          await prisma.installationTicketPackage.update({
            where: { ticketId: event.entityId },
            data: { qrExperienceEnabled: true },
          });

          const { emitQRActivated } = await import("@/modules/ai/events/event-bus");
          emitQRActivated(event.businessId, event.userId, event.entityId, {
            ticketId: event.entityId,
            step: "qr_activated",
          });
        }
      }

      if (step === "STAFF_TRAINED") {
        const servicesNeedingTraining = await prisma.installationService.findMany({
          where: {
            ticketId: event.entityId,
            type: { in: SERVICE_TYPES_REQUIRING_TRAINING as any },
            completed: false,
          },
        });

        if (servicesNeedingTraining.length === 0) {
          const { emitTrainingCompleted } = await import("@/modules/ai/events/event-bus");
          emitTrainingCompleted(event.businessId, event.userId, event.entityId, {
            ticketId: event.entityId,
          });
        }
      }

      if (step === "AWAITING_APPROVAL") {
        const ticket = await prisma.installationTicket.findUnique({
          where: { id: event.entityId },
          select: { ticketNumber: true, business: { select: { name: true } } },
        });
        if (!ticket) return;

        const ownerId = await getBusinessOwnerUserId(event.businessId);
        if (ownerId) {
          await dispatch({
            userId: ownerId,
            businessId: event.businessId,
            title: "Customer Signed Off",
            message: `Customer has signed off on installation ${ticket.ticketNumber} for ${ticket.business.name}. Ready for go-live.`,
            type: "success",
            channels: ["in_app", "email"],
            referenceType: "installation",
            referenceId: event.entityId,
          });
        }
      }
    } catch {}
  });

  firdausEventBus.on("InstallationCompleted", async (event) => {
    try {
      const ticket = await prisma.installationTicket.findUnique({
        where: { id: event.entityId },
        select: {
          ticketNumber: true,
          distributorId: true,
          business: { select: { name: true } },
        },
      });
      if (!ticket) return;

      const ownerId = await getBusinessOwnerUserId(event.businessId);
      if (ownerId) {
        await dispatch({
          userId: ownerId,
          businessId: event.businessId,
          title: "Installation Complete!",
          message: `Your ${ticket.business.name} installation is complete. Please verify and approve on your dashboard.`,
          type: "success",
          channels: ["in_app", "email"],
          referenceType: "installation",
          referenceId: event.entityId,
        });
      }

      if (ticket.distributorId) {
        const distributor = await prisma.distributor.findUnique({
          where: { id: ticket.distributorId },
          select: { userId: true },
        });
        if (distributor) {
          await dispatch({
            userId: distributor.userId,
            businessId: event.businessId,
            title: "Installation Completed",
            message: `Installation ticket ${ticket.ticketNumber} completed. Waiting for owner approval.`,
            type: "success",
            channels: ["in_app"],
            referenceType: "installation",
            referenceId: event.entityId,
          });
        }
      }
    } catch {}
  });

}
