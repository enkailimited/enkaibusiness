import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { apiKeyService } from "@/server/api-keys/service";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    await apiKeyService.revoke(params.id, user.businessId || "");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
