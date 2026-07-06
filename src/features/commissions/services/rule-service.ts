import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type {
  CreateRuleV2Schema,
  UpdateRuleV2Schema,
  CreateCommissionRuleSchema,
  UpdateCommissionRuleSchema,
} from "../schemas";
import type {
  CalculationContext,
  CommissionCalculationResult,
  CommissionBreakdownItem,
  TierConfig,
  HybridConfig,
  CreateRuleV2Data,
} from "../types";

type CommissionRuleV2Record = Prisma.CommissionRuleV2GetPayload<{
  include: { subscriptionPlan: true; installationPackage: true };
}>;

// ─── Legacy V1 Rules ─────────────────────────────────────────────────────────

export async function getRules() {
  return prisma.commissionRule.findMany({
    include: { hierarchyLevel: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRule(id: string) {
  return prisma.commissionRule.findUnique({
    where: { id },
    include: { hierarchyLevel: true },
  });
}

export async function createRule(
  data: CreateCommissionRuleSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const rule = await prisma.commissionRule.create({
      data: {
        name: data.name,
        hierarchyLevelId: data.hierarchyLevelId || null,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        minAmount: data.minAmount !== undefined ? new Prisma.Decimal(data.minAmount) : null,
        maxAmount: data.maxAmount !== undefined ? new Prisma.Decimal(data.maxAmount) : null,
      },
    });

    return {
      success: true,
      message: "Commission rule created successfully",
      data: { id: rule.id },
    };
  } catch (error) {
    console.error("Create rule error:", error);
    return { success: false, message: "Failed to create commission rule" };
  }
}

export async function updateRule(
  id: string,
  data: UpdateCommissionRuleSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.hierarchyLevelId !== undefined) updateData.hierarchyLevelId = data.hierarchyLevelId || null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = new Prisma.Decimal(data.value);
    if (data.minAmount !== undefined) updateData.minAmount = new Prisma.Decimal(data.minAmount);
    if (data.maxAmount !== undefined) updateData.maxAmount = new Prisma.Decimal(data.maxAmount);

    await prisma.commissionRule.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Commission rule updated successfully" };
  } catch (error) {
    console.error("Update rule error:", error);
    return { success: false, message: "Failed to update commission rule" };
  }
}

export async function deleteRule(id: string): Promise<ActionResponse> {
  try {
    await prisma.commissionRule.delete({ where: { id } });
    return { success: true, message: "Commission rule deleted successfully" };
  } catch (error) {
    console.error("Delete rule error:", error);
    return { success: false, message: "Failed to delete commission rule" };
  }
}

// ─── V2 Rules ─────────────────────────────────────────────────────────────────

function buildMetadata(data: CreateRuleV2Data): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (data.calculationType) meta.calculationType = data.calculationType;
  if (data.percentage !== undefined && data.percentage !== null) meta.percentage = data.percentage;
  if (data.flatAmount !== undefined && data.flatAmount !== null) meta.flatAmount = data.flatAmount;
  return meta;
}

export async function getRulesV2(): Promise<CommissionRuleV2Record[]> {
  return prisma.commissionRuleV2.findMany({
    include: {
      subscriptionPlan: true,
      installationPackage: true,
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function getRuleV2(id: string): Promise<CommissionRuleV2Record | null> {
  return prisma.commissionRuleV2.findUnique({
    where: { id },
    include: {
      subscriptionPlan: true,
      installationPackage: true,
    },
  });
}

export async function createRuleV2(
  data: CreateRuleV2Schema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const meta = buildMetadata(data as CreateRuleV2Data);

    const rule = await prisma.commissionRuleV2.create({
      data: {
        name: data.name,
        description: data.description || null,
        triggerEvent: data.triggerEvent as any,
        ruleType: data.ruleType as any,
        industry: (data.industry as any) || null,
        businessModeId: data.businessModeId || null,
        subscriptionPlanId: data.subscriptionPlanId || null,
        installationPackageId: data.installationPackageId || null,
        minRevenue: data.minRevenue != null ? new Prisma.Decimal(data.minRevenue) : null,
        maxRevenue: data.maxRevenue != null ? new Prisma.Decimal(data.maxRevenue) : null,
        minBranches: data.minBranches ?? null,
        maxBranches: data.maxBranches ?? null,
        minCustomers: data.minCustomers ?? null,
        maxCustomers: data.maxCustomers ?? null,
        minCatalogItems: data.minCatalogItems ?? null,
        maxCatalogItems: data.maxCatalogItems ?? null,
        tiers: data.tiers ? (data.tiers as any) : [],
        formula: data.formula || null,
        hybridConfig: data.hybridConfig ? (data.hybridConfig as any) : {},
        priority: data.priority ?? 0,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        metadata: Object.keys(meta).length > 0 ? meta : {},
      },
    });

    return {
      success: true,
      message: "Commission rule V2 created successfully",
      data: { id: rule.id },
    };
  } catch (error) {
    console.error("Create rule V2 error:", error);
    return { success: false, message: "Failed to create commission rule V2" };
  }
}

export async function updateRuleV2(
  id: string,
  data: UpdateRuleV2Schema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.triggerEvent !== undefined) updateData.triggerEvent = data.triggerEvent as any;
    if (data.ruleType !== undefined) updateData.ruleType = data.ruleType as any;
    if (data.industry !== undefined) updateData.industry = (data.industry as any) || null;
    if (data.businessModeId !== undefined) updateData.businessModeId = data.businessModeId || null;
    if (data.subscriptionPlanId !== undefined) updateData.subscriptionPlanId = data.subscriptionPlanId || null;
    if (data.installationPackageId !== undefined) updateData.installationPackageId = data.installationPackageId || null;
    if (data.minRevenue !== undefined) updateData.minRevenue = data.minRevenue != null ? new Prisma.Decimal(data.minRevenue) : null;
    if (data.maxRevenue !== undefined) updateData.maxRevenue = data.maxRevenue != null ? new Prisma.Decimal(data.maxRevenue) : null;
    if (data.minBranches !== undefined) updateData.minBranches = data.minBranches ?? null;
    if (data.maxBranches !== undefined) updateData.maxBranches = data.maxBranches ?? null;
    if (data.minCustomers !== undefined) updateData.minCustomers = data.minCustomers ?? null;
    if (data.maxCustomers !== undefined) updateData.maxCustomers = data.maxCustomers ?? null;
    if (data.minCatalogItems !== undefined) updateData.minCatalogItems = data.minCatalogItems ?? null;
    if (data.maxCatalogItems !== undefined) updateData.maxCatalogItems = data.maxCatalogItems ?? null;
    if (data.tiers !== undefined) updateData.tiers = data.tiers ? (data.tiers as any) : [];
    if (data.formula !== undefined) updateData.formula = data.formula || null;
    if (data.hybridConfig !== undefined) updateData.hybridConfig = data.hybridConfig ? (data.hybridConfig as any) : {};
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.effectiveDate !== undefined) updateData.effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : null;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    if (data.calculationType !== undefined || data.percentage !== undefined || data.flatAmount !== undefined) {
      const existing = await prisma.commissionRuleV2.findUnique({ where: { id }, select: { metadata: true } });
      const currentMeta = (existing?.metadata as Record<string, unknown>) || {};
      if (data.calculationType !== undefined) currentMeta.calculationType = data.calculationType;
      if (data.percentage !== undefined) {
        if (data.percentage !== null) currentMeta.percentage = data.percentage;
        else delete currentMeta.percentage;
      }
      if (data.flatAmount !== undefined) {
        if (data.flatAmount !== null) currentMeta.flatAmount = data.flatAmount;
        else delete currentMeta.flatAmount;
      }
      updateData.metadata = currentMeta;
    }

    await prisma.commissionRuleV2.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Commission rule V2 updated successfully" };
  } catch (error) {
    console.error("Update rule V2 error:", error);
    return { success: false, message: "Failed to update commission rule V2" };
  }
}

export async function deleteRuleV2(id: string): Promise<ActionResponse> {
  try {
    await prisma.commissionRuleV2.delete({ where: { id } });
    return { success: true, message: "Commission rule V2 deleted successfully" };
  } catch (error) {
    console.error("Delete rule V2 error:", error);
    return { success: false, message: "Failed to delete commission rule V2" };
  }
}

export async function toggleRuleV2(id: string): Promise<ActionResponse> {
  try {
    const rule = await prisma.commissionRuleV2.findUnique({ where: { id }, select: { isActive: true } });
    if (!rule) return { success: false, message: "Commission rule V2 not found" };

    await prisma.commissionRuleV2.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });

    return {
      success: true,
      message: `Commission rule V2 ${rule.isActive ? "deactivated" : "activated"} successfully`,
    };
  } catch (error) {
    console.error("Toggle rule V2 error:", error);
    return { success: false, message: "Failed to toggle commission rule V2" };
  }
}

// ─── Rule Matching ────────────────────────────────────────────────────────────

export async function getRulesForEvent(
  triggerEvent: string,
  industry?: string | null,
  businessModeId?: string | null,
  subscriptionPlanId?: string | null,
  installationPackageId?: string | null,
): Promise<CommissionRuleV2Record[]> {
  const now = new Date();
  const filters: Array<Record<string, unknown>> = [];

  if (industry) {
    filters.push({ industry });
  }
  if (businessModeId) {
    filters.push({ businessModeId });
  }
  if (subscriptionPlanId) {
    filters.push({ subscriptionPlanId });
  }
  if (installationPackageId) {
    filters.push({ installationPackageId });
  }

  const matchAny: Array<Record<string, unknown>> = filters.length > 0 ? [...filters] : [];
  matchAny.push({ industry: null });
  if (!businessModeId) matchAny.push({ businessModeId: null });
  if (!subscriptionPlanId) matchAny.push({ subscriptionPlanId: null });
  if (!installationPackageId) matchAny.push({ installationPackageId: null });

  const where: Record<string, unknown> = {
    triggerEvent,
    isActive: true,
    effectiveDate: { lte: now },
    AND: [
      {
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: now } },
        ],
      },
      {
        OR: matchAny,
      },
    ],
  };

  return prisma.commissionRuleV2.findMany({
    where: where as any,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    include: {
      subscriptionPlan: true,
      installationPackage: true,
    },
  });
}

// ─── Formula Evaluation ───────────────────────────────────────────────────────

function evaluateFormula(formula: string, context: CalculationContext): number {
  let expr = formula;

  for (const [key, value] of Object.entries(context)) {
    if (typeof value === "number") {
      expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(value));
    }
  }

  expr = expr.replace(/\btrue\b/g, "1").replace(/\bfalse\b/g, "0");

  const allowed = /^[\d\s+\-*/().,]+$/;
  if (!allowed.test(expr)) return 0;

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result !== "number" || !isFinite(result)) return 0;
    return Math.max(0, result);
  } catch {
    return 0;
  }
}

// ─── Calculation Engine ───────────────────────────────────────────────────────

function calculateByType(
  rule: Prisma.CommissionRuleV2GetPayload<{}>,
  amount: number,
  context: CalculationContext,
): number {
  const meta = (rule.metadata as Record<string, unknown>) || {};
  const calculationType = (meta.calculationType as string) || "PERCENTAGE";
  const percentage = (meta.percentage as number) || 0;
  const flatAmount = (meta.flatAmount as number) || 0;

  switch (calculationType) {
    case "FLAT": {
      return flatAmount;
    }

    case "PERCENTAGE": {
      return (amount * percentage) / 100;
    }

    case "FORMULA": {
      if (!rule.formula) return 0;
      return evaluateFormula(rule.formula, context);
    }

    case "TIERED": {
      const tiers = rule.tiers as unknown as TierConfig[];
      if (!tiers || tiers.length === 0) return 0;

      const sorted = [...tiers].sort((a, b) => a.min - b.min);
      for (const tier of sorted) {
        if (amount >= tier.min && amount <= tier.max) {
          if (tier.percentage !== undefined) {
            return (amount * tier.percentage) / 100;
          }
          return tier.flatAmount || 0;
        }
      }
      return 0;
    }

    case "HYBRID": {
      const config = rule.hybridConfig as unknown as HybridConfig;
      if (!config || !config.rules || config.rules.length === 0) return 0;

      const amounts = config.rules.map((sub) => {
        switch (sub.calculationType) {
          case "FLAT":
            return sub.value || 0;
          case "PERCENTAGE":
            return (amount * (sub.value || 0)) / 100;
          case "FORMULA":
            return sub.formula ? evaluateFormula(sub.formula, context) : 0;
          default:
            return 0;
        }
      });

      switch (config.operator) {
        case "MAX":
          return Math.max(...amounts);
        case "AVERAGE":
          return amounts.reduce((a, b) => a + b, 0) / amounts.length;
        case "SUM":
        default:
          return amounts.reduce((a, b) => a + b, 0);
      }
    }

    default:
      return 0;
  }
}

export async function calculateCommissionV2(
  salesProfileId: string,
  triggerEvent: string,
  amount: number,
  context: CalculationContext,
): Promise<CommissionCalculationResult | null> {
  try {
    const profile = await prisma.salesProfile.findUnique({
      where: { id: salesProfileId },
      select: { id: true },
    });
    if (!profile) return null;

    const rules = await getRulesForEvent(
      triggerEvent,
      context.industry,
      context.businessModeId,
      context.subscriptionPlanId,
      context.installationPackageId,
    );

    const breakdown: CommissionBreakdownItem[] = [];
    let total = 0;

    for (const rule of rules) {
      if (rule.minRevenue != null && context.revenue !== undefined && context.revenue < Number(rule.minRevenue)) continue;
      if (rule.maxRevenue != null && context.revenue !== undefined && context.revenue > Number(rule.maxRevenue)) continue;
      if (rule.minBranches != null && context.branchCount !== undefined && context.branchCount < rule.minBranches) continue;
      if (rule.maxBranches != null && context.branchCount !== undefined && context.branchCount > rule.maxBranches) continue;
      if (rule.minCustomers != null && context.customerCount !== undefined && context.customerCount < rule.minCustomers) continue;
      if (rule.maxCustomers != null && context.customerCount !== undefined && context.customerCount > rule.maxCustomers) continue;
      if (rule.minCatalogItems != null && context.catalogItemCount !== undefined && context.catalogItemCount < rule.minCatalogItems) continue;
      if (rule.maxCatalogItems != null && context.catalogItemCount !== undefined && context.catalogItemCount > rule.maxCatalogItems) continue;

      const ruleAmount = calculateByType(rule, amount, context);
      if (ruleAmount <= 0) continue;

      const meta = (rule.metadata as Record<string, unknown>) || {};
      total += ruleAmount;
      breakdown.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        calculationType: (meta.calculationType as string) || "PERCENTAGE",
        amount: ruleAmount,
        description: rule.description || undefined,
      });
    }

    return { total, breakdown };
  } catch (error) {
    console.error("Calculate commission V2 error:", error);
    return null;
  }
}

export async function getRuleBreakdown(
  ruleId: string,
  amount: number,
  context: CalculationContext,
): Promise<{ rule: Prisma.CommissionRuleV2GetPayload<{}> | null; calculatedAmount: number }> {
  const rule = await prisma.commissionRuleV2.findUnique({ where: { id: ruleId } });
  if (!rule) return { rule: null, calculatedAmount: 0 };

  const calculatedAmount = calculateByType(rule, amount, context);
  return { rule, calculatedAmount };
}
