"use server";

import { requireAuth } from "@/server/auth";
import { getPlatformStats } from "@/platform/dashboard";
import { serialize } from "@/lib/utils";

export async function getPlatformStatsAction() {
  await requireAuth();
  const stats = await getPlatformStats();
  return serialize(stats);
}
