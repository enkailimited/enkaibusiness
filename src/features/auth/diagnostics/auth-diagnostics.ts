import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";

export interface AuthDiagnosticResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: "pass" | "fail" | "warn"; message: string; details?: unknown }>;
  timestamp: string;
}

export async function runAuthDiagnostics(): Promise<AuthDiagnosticResult> {
  const checks: AuthDiagnosticResult["checks"] = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "pass", message: "PostgreSQL connection is healthy" };
  } catch (error) {
    checks.database = {
      status: "fail",
      message: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  try {
    const config = auth.options;
    checks.authConfig = {
      status: "pass",
      message: "Better Auth is configured",
      details: {
        appName: config.appName,
        emailAuth: config.emailAndPassword?.enabled,
        sessionExpiry: config.session?.expiresIn,
      },
    };
  } catch (error) {
    checks.authConfig = {
      status: "fail",
      message: "Better Auth configuration error",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
    `;
    const tableNames = tables.map((t) => t.tablename);
    const requiredTables = ["user", "session", "account", "verification"];
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t));
    checks.authTables = {
      status: missingTables.length === 0 ? "pass" : "warn",
      message:
        missingTables.length === 0
          ? "All auth tables exist"
          : `Missing tables: ${missingTables.join(", ")}`,
      details: { existing: tableNames.filter((t) => requiredTables.includes(t)), missing: missingTables },
    };
  } catch (error) {
    checks.authTables = {
      status: "fail",
      message: "Could not check auth tables",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    checks.session = {
      status: session?.user ? "pass" : "warn",
      message: session?.user ? "Session is active" : "No active session (expected for unauthenticated users)",
      details: session?.user ? { userId: session.user.id, email: session.user.email } : undefined,
    };
  } catch (error) {
    checks.session = {
      status: "warn",
      message: "Session check failed (may be normal for unauthenticated requests)",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

    try {
      const cookieConfig = auth.options.advanced?.cookies;
      const sessionCookie = cookieConfig?.session;
      checks.cookies = {
        status: sessionCookie ? "pass" : "warn",
        message: sessionCookie ? "Cookie configuration found" : "No session cookie config",
        details: sessionCookie
          ? {
              sessionCookieName: sessionCookie.name,
              sameSite: sessionCookie.attributes?.sameSite,
              secure: sessionCookie.attributes?.secure,
            }
          : undefined,
      };
    } catch (error) {
      checks.cookies = {
        status: "fail",
        message: "Cookie configuration error",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }

  try {
    const userCount = await prisma.user.count();
    checks.userTable = {
      status: "pass",
      message: `User table has ${userCount} records`,
      details: { count: userCount },
    };
  } catch (error) {
    checks.userTable = {
      status: "fail",
      message: "Could not query user table",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  try {
    const wmCount = await prisma.workspaceMember.count();
    checks.workspaceMembers = {
      status: "pass",
      message: `Workspace members table has ${wmCount} records`,
      details: { count: wmCount },
    };
  } catch (error) {
    checks.workspaceMembers = {
      status: "fail",
      message: "Could not query workspace members",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  try {
    const roleCount = await prisma.role.count();
    checks.roles = {
      status: "pass",
      message: `Roles table has ${roleCount} records`,
      details: { count: roleCount },
    };
  } catch (error) {
    checks.roles = {
      status: "fail",
      message: "Could not query roles",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const failCount = Object.values(checks).filter((c) => c.status === "fail").length;
  const warnCount = Object.values(checks).filter((c) => c.status === "warn").length;

  return {
    status: failCount > 0 ? "unhealthy" : warnCount > 0 ? "degraded" : "healthy",
    checks,
    timestamp: new Date().toISOString(),
  };
}
