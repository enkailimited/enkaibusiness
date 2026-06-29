import "server-only";

import { prisma } from "@/server/db";
import { boss } from "../queue";

export function registerNotificationWorker(): void {
  boss.work("send-notification", async ([job]) => {
    const { userId, businessId, title, message, type, referenceType, referenceId, link } = job.data as {
      userId: string;
      businessId?: string;
      title: string;
      message: string;
      type?: string;
      referenceType?: string;
      referenceId?: string;
      link?: string;
    };

    try {
      await prisma.notification.create({
        data: {
          userId,
          businessId: businessId ?? null,
          title,
          message: message.slice(0, 500),
          type: type ?? "info",
          referenceType: referenceType ?? null,
          referenceId: referenceId ?? null,
          link: link ?? null,
        },
      });

      await prisma.jobRecord.updateMany({
        where: { type: "send-notification", status: "queued" },
        data: { status: "completed", completedAt: new Date() },
      }).catch(() => {});
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Notification error";

      await prisma.jobRecord.updateMany({
        where: { type: "send-notification", status: "queued" },
        data: { status: "failed", error: messageText },
      }).catch(() => {});

      throw error;
    }
  });
}
