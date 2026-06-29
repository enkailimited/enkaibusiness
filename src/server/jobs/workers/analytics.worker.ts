import "server-only";

import { prisma } from "@/server/db";
import { boss } from "../queue";

export function registerAnalyticsWorker(): void {
  boss.work("refresh-analytics", async ([job]) => {
    const { businessId } = job.data as { businessId: string };

    try {
      await prisma.$executeRawUnsafe(
        `REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS dashboard_metrics`,
      ).catch(() => {});

      await prisma.jobRecord.updateMany({
        where: { type: "refresh-analytics", status: "queued" },
        data: { status: "completed", completedAt: new Date() },
      }).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analytics error";
      await prisma.jobRecord.updateMany({
        where: { type: "refresh-analytics", status: "queued" },
        data: { status: "failed", error: message },
      }).catch(() => {});
      throw error;
    }
  });
}

export function registerReportGenerator(): void {
  boss.work("generate-report", async ([job]) => {
    const { businessId, reportType, startDate, endDate, format } = job.data as {
      businessId: string;
      reportType: string;
      startDate?: string;
      endDate?: string;
      format?: string;
    };

    try {
      const pdfFormat = format ?? "pdf";

      await prisma.jobRecord.updateMany({
        where: { type: "generate-report", status: "queued" },
        data: { status: "completed", completedAt: new Date() },
      }).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Report error";
      await prisma.jobRecord.updateMany({
        where: { type: "generate-report", status: "queued" },
        data: { status: "failed", error: message },
      }).catch(() => {});
      throw error;
    }
  });
}
