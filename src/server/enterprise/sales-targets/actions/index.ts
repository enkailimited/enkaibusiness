"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import type { TargetPeriod, KpiPeriod } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";

import {
  getTarget,
  setTarget as setTargetService,
  getProgress,
  getTeamTargets,
} from "../services/target-service";
import {
  computeAndStoreSnapshot,
  getRevenueChart,
  getKPISummary as getKpiSummaryData,
} from "../services/kpi-snapshot-service";
import { getTargetSchema, setTargetSchema } from "../schemas";

export async function getTargetAction(data: { salesProfileId: string; period: TargetPeriod; year: number; month?: number; week?: number }) {
  await requireAuth();
  const parsed = getTargetSchema.safeParse(data);
  if (!parsed.success) return null;
  return serialize(await getTarget(parsed.data.salesProfileId, parsed.data.period, parsed.data.year, parsed.data.month, parsed.data.week));
}

export async function setTargetAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();
  const raw: Record<string, unknown> = {
    salesProfileId: formData.get("salesProfileId"),
    period: formData.get("period"),
    year: formData.get("year") ? Number(formData.get("year")) : undefined,
  };
  for (const key of ["month", "week"]) {
    const val = formData.get(key);
    if (val) raw[key] = Number(val);
  }
  for (const key of [
    "leadsTarget", "conversionsTarget", "renewalsTarget", "retentionTarget",
    "installationsTarget", "trainingTarget",
  ]) {
    const val = formData.get(key);
    if (val) raw[key] = Number(val);
  }
  for (const key of ["revenueTarget", "recurringRevenueTarget", "collectionsTarget"]) {
    const val = formData.get(key);
    if (val) raw[key] = Number(val);
  }

  const parsed = setTargetSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const target = await setTargetService(parsed.data);
    revalidatePath("/sales/targets");
    return { success: true, message: "Target set successfully", data: { id: target.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to set target" };
  }
}

export async function getProgressAction() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return [];
  return serialize(await getProgress(profile.id));
}

export async function getTeamTargetsAction() {
  const user = await requireAuth();
  return serialize(await getTeamTargets(user.id));
}

export async function computeKpiSnapshotAction(period: KpiPeriod) {
  await requireAuth();
  return serialize(await computeAndStoreSnapshot(period));
}

export async function getKPISummaryAction() {
  await requireAuth();
  return serialize(await getKpiSummaryData());
}

export async function getRevenueTrendAction(period: KpiPeriod = "MONTHLY", limit: number = 12) {
  await requireAuth();
  return serialize(await getRevenueChart(period, limit));
}
