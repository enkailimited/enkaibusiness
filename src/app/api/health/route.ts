import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getConnectedCount } from "@/server/sse";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: "pass" | "fail" | "warn"; message: string; detail?: unknown }>;
  metrics: {
    uptime: number;
    memory: string;
    connections: number;
  };
  timestamp: string;
}

export async function GET() {
  const checks: HealthCheck["checks"] = {};
  let overallStatus: HealthCheck["status"] = "healthy";

  const startDb = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "pass",
      message: `Database reachable (${Date.now() - startDb}ms)`,
    };
  } catch (error) {
    checks.database = { status: "fail", message: "Database unreachable", detail: error instanceof Error ? error.message : "Unknown" };
    overallStatus = "unhealthy";
  }

  try {
    const count = await prisma.eventRecord.count();
    checks.eventBus = {
      status: "pass",
      message: `EventRecord table accessible (${count} events)`,
    };
  } catch (error) {
    checks.eventBus = { status: "warn", message: "EventRecord check failed", detail: error instanceof Error ? error.message : "Unknown" };
    if (overallStatus === "healthy") overallStatus = "degraded";
  }

  try {
    const sseCount = getConnectedCount();
    checks.realtime = {
      status: "pass",
      message: `${sseCount} active SSE connection(s)`,
    };
  } catch {
    checks.realtime = { status: "warn", message: "SSE metrics unavailable" };
  }

  const memory = process.memoryUsage();
  checks.memory = {
    status: memory.heapUsed / memory.heapTotal > 0.9 ? "warn" : "pass",
    message: `Heap: ${(memory.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(memory.heapTotal / 1024 / 1024).toFixed(1)}MB`,
  };

  const response: HealthCheck = {
    status: overallStatus,
    checks,
    metrics: {
      uptime: Math.floor(process.uptime()),
      memory: `${(memory.rss / 1024 / 1024).toFixed(0)}MB RSS`,
      connections: 0,
    },
    timestamp: new Date().toISOString(),
  };

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;
  return NextResponse.json(response, { status: statusCode });
}
