"use server";

import { requireAuth } from "@/server/auth";
import {
  getCampaignMetrics,
  getLeadSources,
  getConversionTrend,
} from "@/server/services/marketing-service";

export async function getCampaignMetricsAction() {
  await requireAuth();
  return getCampaignMetrics();
}

export async function getLeadSourcesAction() {
  await requireAuth();
  return getLeadSources();
}

export async function getConversionTrendAction(days?: number) {
  await requireAuth();
  return getConversionTrend(days);
}
