import "server-only";

import { prisma } from "@/server/db";
import { boss } from "../queue";

export function registerEmailWorker(): void {
  boss.work("send-email", async ([job]) => {
    const { to, subject, html, businessId, userId } = job.data as {
      to: string;
      subject: string;
      html: string;
      businessId?: string;
      userId?: string;
    };

    try {
      const { sendEmail } = await import("@/notifications/email/services/smtp-service");
      await sendEmail(to, subject, html);

      await prisma.jobRecord.updateMany({
        where: { type: "send-email", status: "queued" },
        data: { status: "completed", completedAt: new Date() },
      }).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";

      await prisma.jobRecord.updateMany({
        where: { type: "send-email", status: "queued" },
        data: { status: "failed", error: message, attempts: { increment: 1 } },
      }).catch(() => {});

      throw error;
    }
  });
}
