import "server-only";

import { prisma } from "@/server/db";

export interface PlatformSetting {
  key: string;
  value: string;
  description: string;
}

const DEFAULT_SETTINGS: PlatformSetting[] = [
  { key: "platform_name", value: "Enkai Business", description: "Platform display name" },
  { key: "maintenance_mode", value: "false", description: "Enable maintenance mode" },
  { key: "max_workspaces_per_user", value: "5", description: "Maximum workspaces per user" },
  { key: "default_currency", value: "TZS", description: "Default currency" },
  { key: "session_timeout_minutes", value: "1440", description: "Session timeout in minutes" },
  { key: "enable_registration", value: "true", description: "Allow new user registration" },
];

export async function getPlatformSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findFirst({
    where: { key, businessId: null, userId: null },
  });
  return setting?.value || null;
}

export async function setPlatformSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { businessId_userId_key: { businessId: "00000000-0000-0000-0000-000000000000", userId: "00000000-0000-0000-0000-000000000000", key } },
    update: { value },
    create: { key, value, type: "string" },
  });
}

export function getDefaultSettings(): PlatformSetting[] {
  return DEFAULT_SETTINGS;
}
