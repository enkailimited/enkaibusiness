import { NextResponse } from "next/server";
import { runAuthDiagnostics } from "@/features/auth/diagnostics/auth-diagnostics";

export async function GET() {
  try {
    const diagnostics = await runAuthDiagnostics();

    const statusCode = diagnostics.status === "healthy" ? 200 : diagnostics.status === "degraded" ? 200 : 503;

    return NextResponse.json(diagnostics, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        checks: {
          runtime: {
            status: "fail",
            message: "Diagnostics runner failed",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
