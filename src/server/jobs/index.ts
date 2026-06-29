import { startQueue, boss } from "./queue";
import { registerEmailWorker } from "./workers/email.worker";
import { registerNotificationWorker } from "./workers/notification.worker";
import { registerAnalyticsWorker, registerReportGenerator } from "./workers/analytics.worker";

export async function initializeWorkers(): Promise<void> {
  await startQueue();

  registerEmailWorker();
  registerNotificationWorker();
  registerAnalyticsWorker();
  registerReportGenerator();

  console.log("[Jobs] Workers registered: email, notification, analytics, report");
}

export async function startScheduledJobs(): Promise<void> {
  await startQueue();

  const { schedule } = await import("./queue");

  const cronJobs = [
    { name: "refresh-daily-analytics", cron: "0 2 * * *", type: "refresh-analytics" as const, data: {} },
    { name: "cleanup-old-events", cron: "0 3 * * 0", type: "refresh-analytics" as const, data: {} },
  ];

  for (const job of cronJobs) {
    await schedule(job.type, job.name, job.cron, job.data).catch((err) => {
      console.error(`[Jobs] Failed to schedule ${job.name}:`, err);
    });
  }

  console.log("[Jobs] Scheduled jobs registered");
}

export { enqueue, schedule, getQueueStats, startQueue, stopQueue } from "./queue";
