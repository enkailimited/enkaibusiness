import "server-only";

import { prisma } from "@/server/db";

export interface SystemHealth {
  database: { status: "healthy" | "unhealthy"; latencyMs: number };
  api: { status: "healthy" | "unhealthy"; uptimeHours: number };
  storage: { status: "healthy" | "unhealthy"; totalUploads: number };
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    const uploadCount = await prisma.upload.count();

    return {
      database: { status: "healthy", latencyMs: dbLatency },
      api: { status: "healthy", uptimeHours: process.uptime() / 3600 },
      storage: { status: "healthy", totalUploads: uploadCount },
    };
  } catch {
    return {
      database: { status: "unhealthy", latencyMs: -1 },
      api: { status: "healthy", uptimeHours: process.uptime() / 3600 },
      storage: { status: "healthy", totalUploads: 0 },
    };
  }
}

export async function getSystemMetrics() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [activeSessions, todaySales, todayUsers, errors] = await Promise.all([
    prisma.session.count(),
    prisma.sale.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.auditLog.count({
      where: { createdAt: { gte: today }, action: { contains: "error", mode: "insensitive" } },
    }),
  ]);

  return { activeSessions, todaySales, todayUsers, errors };
}
