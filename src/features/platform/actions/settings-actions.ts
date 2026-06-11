"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export async function savePlatformSettingsAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const name = (formData.get("platform_name") || "").toString().trim();
  const email = (formData.get("support_email") || "").toString().trim();

  if (!name || !email) {
    return { success: false, message: "Platform name and support email are required" };
  }

  await Promise.all([
    prisma.setting.upsert({
      where: { businessId_key: { businessId: null as any, key: "platform_name" } },
      update: { value: name },
      create: { key: "platform_name", value: name, type: "string" },
    }),
    prisma.setting.upsert({
      where: { businessId_key: { businessId: null as any, key: "support_email" } },
      update: { value: email },
      create: { key: "support_email", value: email, type: "string" },
    }),
  ]);

  revalidatePath("/platform/settings");

  return { success: true, message: "Settings saved" };
}
