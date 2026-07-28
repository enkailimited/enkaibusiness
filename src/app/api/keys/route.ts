import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { apiKeyService } from "@/server/api-keys/service";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, permissions, scope, expiresInDays } = body;

    if (!name || !permissions) {
      return NextResponse.json({ error: "name and permissions are required" }, { status: 400 });
    }

    const result = await apiKeyService.create({
      businessId: user.businessId || body.businessId,
      name,
      permissions,
      scope,
      expiresInDays,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const businessId = user.businessId || req.nextUrl.searchParams.get("businessId") || "";
    const keys = await apiKeyService.list(businessId);
    return NextResponse.json({ keys });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
