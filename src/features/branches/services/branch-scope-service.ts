import { prisma } from "@/server/db";
import type { BranchingMode } from "@prisma/client";

export async function getBranchingMode(businessId: string): Promise<BranchingMode> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { branchingMode: true },
  });
  return business?.branchingMode ?? "ISOLATED";
}

export async function requireBranchId(businessId: string): Promise<boolean> {
  const mode = await getBranchingMode(businessId);
  return mode === "ISOLATED";
}

export async function enforceBranchScope(
  businessId: string,
  branchId: string | null | undefined,
): Promise<{ branchId: string | null }> {
  const mode = await getBranchingMode(businessId);
  if (mode === "ISOLATED" && !branchId) {
    throw new Error("Branch ID is required when business uses ISOLATED branching mode");
  }
  return { branchId: branchId ?? null };
}

export function buildBranchFilter(
  branchId: string | null | undefined,
  activeBranchId?: string | null,
  allBranchesSelected?: boolean,
): Record<string, string> | undefined {
  if (allBranchesSelected) return undefined;
  const id = branchId ?? activeBranchId;
  if (!id) return undefined;
  return { branchId: id };
}

export type BranchScope = {
  branchId?: string;
  businessId: string;
};

export async function resolveBranchScope(
  businessId: string,
  activeBranchId?: string | null,
  allBranches?: boolean,
): Promise<{ branchIds: string[]; scope: "single" | "all" }> {
  if (allBranches) {
    const branches = await prisma.branch.findMany({
      where: { businessId, isActive: true },
      select: { id: true },
    });
    return { branchIds: branches.map((b) => b.id), scope: "all" };
  }
  if (activeBranchId) {
    return { branchIds: [activeBranchId], scope: "single" };
  }
  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    select: { id: true },
  });
  return { branchIds: branches.map((b) => b.id), scope: "all" };
}
