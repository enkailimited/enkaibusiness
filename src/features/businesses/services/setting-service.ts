import "server-only";

import { prisma } from "@/server/db";

export async function getBusinessSetting(businessId: string, key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { businessId_key: { businessId, key } },
  });
  return setting?.value ?? null;
}

export async function setBusinessSetting(
  businessId: string,
  key: string,
  value: string,
  type: "string" | "number" | "boolean" | "json" = "string",
  description?: string,
): Promise<void> {
  await prisma.setting.upsert({
    where: { businessId_key: { businessId, key } },
    update: { value, type },
    create: {
      businessId,
      key,
      value,
      type,
      description,
    },
  });
}

export async function getBusinessSettingsMap(businessId: string): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany({
    where: { businessId },
  });
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
}

export async function isQrOrderingEnabled(businessId: string): Promise<boolean> {
  const value = await getBusinessSetting(businessId, "qr_ordering_enabled");
  return value === "true";
}
