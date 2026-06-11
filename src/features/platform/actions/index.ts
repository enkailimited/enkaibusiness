"use server";

import { requireAuth } from "@/server/auth";
import { getPlatformStats, getRecentActivity, getPlatformUsers } from "../services/platform-service";

export async function getPlatformStatsAction() {
  await requireAuth();
  return getPlatformStats();
}

export async function getRecentActivityAction(limit?: number) {
  await requireAuth();
  return getRecentActivity(limit);
}

export async function getPlatformUsersAction(options?: { search?: string; page?: number; limit?: number }) {
  await requireAuth();
  return getPlatformUsers(options);
}
