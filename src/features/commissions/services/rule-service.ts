import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCommissionRuleSchema, UpdateCommissionRuleSchema } from "../schemas";
import type { RuleWithHierarchy } from "../types";

export async function getRules(): Promise<RuleWithHierarchy[]> {
  return prisma.commissionRule.findMany({
    include: { hierarchyLevel: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRule(id: string): Promise<RuleWithHierarchy | null> {
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
