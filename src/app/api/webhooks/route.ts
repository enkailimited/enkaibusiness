import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { webhookService } from "@/server/webhooks/service";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, url, events, secret, headers, retryCount, timeoutMs } = body;

    if (!name || !url || !events || !events.length) {
      return NextResponse.json({ error: "name, url, and events are required" }, { status: 400 });
    }

    const webhook = await webhookService.register({
      businessId: user.businessId || body.businessId,
      name,
      url,
      events,
      secret,
      headers,
      retryCount,
      timeoutMs,
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const businessId = user.businessId || req.nextUrl.searchParams.get("businessId") || "";
    const webhooks = await webhookService.list(businessId);
    return NextResponse.json({ webhooks });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
