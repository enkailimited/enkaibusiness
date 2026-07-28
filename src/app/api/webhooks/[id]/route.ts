import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { webhookService } from "@/server/webhooks/service";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const webhook = await webhookService.update(params.id, user.businessId || "", body);
    return NextResponse.json({ webhook });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized or not found" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    await webhookService.delete(params.id, user.businessId || "");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized or not found" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    if (body.isActive !== undefined) {
      const webhook = await webhookService.toggle(params.id, user.businessId || "", body.isActive);
      return NextResponse.json({ webhook });
    }
    return NextResponse.json({ error: "isActive field required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
