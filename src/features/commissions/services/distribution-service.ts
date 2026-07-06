import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateDistributionData, UpdateDistributionData, DistributionResult, DistributionAllocation } from "../types";

export async function getDistributionRules() {
  return prisma.commissionDistribution.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function createDistributionRule(
  data: CreateDistributionData,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const rule = await prisma.commissionDistribution.create({
      data: {
        name: data.name,
        description: data.description || null,
        participantType: data.participantType,
        percentage: new Prisma.Decimal(data.percentage),
        fixedAmount: data.fixedAmount != null ? new Prisma.Decimal(data.fixedAmount) : null,
        priority: data.priority ?? 0,
      },
    });

    return {
      success: true,
      message: "Distribution rule created successfully",
      data: { id: rule.id },
    };
  } catch (error) {
    console.error("Create distribution rule error:", error);
    return { success: false, message: "Failed to create distribution rule" };
  }
}

export async function updateDistributionRule(
  id: string,
  data: UpdateDistributionData,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.participantType !== undefined) updateData.participantType = data.participantType;
    if (data.percentage !== undefined) updateData.percentage = new Prisma.Decimal(data.percentage);
    if (data.fixedAmount !== undefined) updateData.fixedAmount = data.fixedAmount != null ? new Prisma.Decimal(data.fixedAmount) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.commissionDistribution.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Distribution rule updated successfully" };
  } catch (error) {
    console.error("Update distribution rule error:", error);
    return { success: false, message: "Failed to update distribution rule" };
  }
}

export async function deleteDistributionRule(id: string): Promise<ActionResponse> {
  try {
    await prisma.commissionDistribution.delete({ where: { id } });
    return { success: true, message: "Distribution rule deleted successfully" };
  } catch (error) {
    console.error("Delete distribution rule error:", error);
    return { success: false, message: "Failed to delete distribution rule" };
  }
}

export async function distributePayment(
  totalAmount: number,
): Promise<DistributionResult> {
  const rules = await prisma.commissionDistribution.findMany({
    where: { isActive: true },
    orderBy: { priority: "asc" },
  });

  if (rules.length === 0) {
    return {
      total: totalAmount,
      distributions: [
        {
          participantType: "default",
          percentage: 100,
          amount: totalAmount,
        },
      ],
    };
  }

  const totalPercentage = rules.reduce((sum, r) => sum + Number(r.percentage), 0);

  let remainingAmount = totalAmount;
  const distributions: DistributionAllocation[] = [];

  for (const rule of rules) {
    const fixed = rule.fixedAmount ? Number(rule.fixedAmount) : 0;
    const pctOfTotal = totalPercentage > 0 ? Number(rule.percentage) / totalPercentage : 0;
    const variableAmount = totalAmount * pctOfTotal;
    const allocationAmount = Math.min(fixed + variableAmount, remainingAmount);

    remainingAmount -= allocationAmount;

    distributions.push({
      participantType: rule.participantType,
      percentage: Number(rule.percentage),
      amount: allocationAmount,
      fixedAmount: fixed > 0 ? fixed : undefined,
    });
  }

  if (remainingAmount > 0.01) {
    const defaultDist = distributions.find((d) => d.participantType === "default");
    if (defaultDist) {
      defaultDist.amount += remainingAmount;
    }
  }

  return { total: totalAmount, distributions };
}

export async function getDistributionForAmount(totalAmount: number): Promise<DistributionResult> {
  return distributePayment(totalAmount);
}
