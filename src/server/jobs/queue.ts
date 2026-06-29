import "server-only";

import PgBoss from "pg-boss";
import { prisma } from "@/server/db";

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  schema: "boss",
  retainCompletion: 7 * 24 * 60 * 60,
  expireSeconds: 5 * 60,
  archiveInterval: 60,
  archiveOlderAfter: 7 * 24 * 60 * 60,
});

let started = false;

export async function startQueue(): Promise<void> {
  if (started) return;
  await boss.start();
  started = true;
}

export async function stopQueue(): Promise<void> {
  if (!started) return;
  await boss.stop();
  started = false;
}

export type JobType =
  | "send-email"
  | "send-notification"
  | "send-sms"
  | "refresh-analytics"
  | "generate-report"
  | "generate-pdf"
  | "process-webhook"
  | "sync-search-index";

export interface JobPayload {
  type: JobType;
  name: string;
  businessId?: string;
  userId?: string;
  data: Record<string, unknown>;
}

export async function enqueue(
  type: JobType,
  name: string,
  data: Record<string, unknown>,
  options?: {
    businessId?: string;
    userId?: string;
    runAt?: Date;
    priority?: number;
    retryLimit?: number;
    retryBackoff?: boolean;
  },
): Promise<string | null> {
  await startQueue();

  const jobId = await boss.send(
    type,
    { businessId: options?.businessId, userId: options?.userId, ...data },
    {
      startAfter: options?.runAt,
      priority: options?.priority ?? 0,
      retryLimit: options?.retryLimit ?? 3,
      retryBackoff: options?.retryBackoff ?? true,
    },
  );

  if (jobId) {
    await prisma.jobRecord.create({
      data: {
        type,
        name,
        businessId: options?.businessId,
        userId: options?.userId,
        payload: data as Record<string, unknown>,
        status: "queued",
        priority: options?.priority ?? 0,
        maxAttempts: options?.retryLimit ?? 3,
      },
    }).catch(() => {});

    await prisma.jobRecord.updateMany({
      where: { type, status: "queued", createdAt: { not: undefined } },
      data: { status: "queued" },
    }).catch(() => {});
  }

  return jobId;
}

export async function schedule(
  type: JobType,
  name: string,
  cron: string,
  data: Record<string, unknown>,
  options?: {
    businessId?: string;
    userId?: string;
    priority?: number;
  },
): Promise<string | null> {
  await startQueue();

  const jobId = await boss.schedule(name, cron, data, {
    priority: options?.priority ?? 0,
  });

  return jobId;
}

export async function cancelJob(jobId: string): Promise<void> {
  await boss.cancel(jobId);
}

export async function getQueueStats(): Promise<{
  queued: number;
  active: number;
  completed: number;
  failed: number;
  cancelled: number;
}> {
  const [created, active, completed, failed, cancelled] = await Promise.all([
    boss.getQueueSize("created"),
    boss.getQueueSize("active"),
    boss.getQueueSize("completed"),
    boss.getQueueSize("failed"),
    boss.getQueueSize("cancelled"),
  ]);

  return {
    queued: created,
    active,
    completed,
    failed,
    cancelled,
  };
}

export { boss };
