import { NextResponse } from "next/server";
import { initializeWorkers, startScheduledJobs, getQueueStats } from "@/server/jobs";

export async function GET() {
  try {
    const stats = await getQueueStats();
    return NextResponse.json({ status: "ok", stats });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Queue error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === "init") {
      await initializeWorkers();
      return NextResponse.json({ status: "ok", message: "Workers initialized" });
    }

    if (body.action === "schedule") {
      await startScheduledJobs();
      return NextResponse.json({ status: "ok", message: "Scheduled jobs started" });
    }

    if (body.action === "stats") {
      const stats = await getQueueStats();
      return NextResponse.json({ status: "ok", stats });
    }

    return NextResponse.json(
      { status: "error", message: "Unknown action. Use: init, schedule, stats" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Request failed" },
      { status: 500 },
    );
  }
}
