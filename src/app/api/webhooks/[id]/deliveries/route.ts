import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { webhookService } from "@/server/webhooks/service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;
    const deliveries = await webhookService.getDeliveries(params.id, limit);
    return NextResponse.json({ deliveries });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
