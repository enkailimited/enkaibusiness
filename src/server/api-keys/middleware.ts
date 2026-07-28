import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { apiKeyService } from "./service";

export interface ApiKeyAuth {
  type: "api-key";
  apiKey: {
    id: string;
    name: string;
    businessId: string;
    permissions: string[];
    scope: string;
  };
}

export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyAuth | NextResponse | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7).trim();
  if (!key.startsWith("enk_")) return null;

  const result = await apiKeyService.validate(key);
  if (!result.valid || !result.apiKey) {
    return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
  }

  return {
    type: "api-key",
    apiKey: {
      id: result.apiKey.id,
      name: result.apiKey.name,
      businessId: "",
      permissions: result.apiKey.permissions,
      scope: result.apiKey.scope,
    },
  };
}

export function requireApiPermission(permission: string) {
  return (handler: (req: NextRequest, auth: ApiKeyAuth) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const auth = await authenticateApiKey(req);
      if (!auth || auth instanceof NextResponse) {
        return auth || NextResponse.json({ error: "API key required" }, { status: 401 });
      }
      const hasPermission = await apiKeyService.hasPermission(auth.apiKey, permission);
      if (!hasPermission) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
      return handler(req, auth);
    };
  };
}
