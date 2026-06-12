import "server-only";

import { prisma } from "@/server/db";

export interface BusinessSetupData {
  name: string;
  type: string;
  branchName: string;
  branchAddress?: string;
  storeName?: string;
  currency?: string;
  industry?: string;
}

const stepQuestions: Record<string, string> = {
  name: "Jina la biashara?",
  type: "Aina ya biashara? (mf: Retail, Wholesale, Restaurant, Pharmacy, Salon, Grocery)",
  branchName: "Jina la tawi la kwanza?",
  branchAddress: "Anuani ya tawi? (hiari)",
  storeName: "Jina la duka la kwanza? (hiari)",
};

export async function createBusiness(
  userId: string,
  workspaceId: string,
  data: BusinessSetupData,
) {
  const business = await prisma.business.create({
    data: {
      name: data.name,
      type: data.type,
      industry: data.industry || data.type,
      workspaceId,
      currency: data.currency || "TZS",
      isActive: true,
      modes: {
        create: { industry: (data.industry || data.type) as never, mode: data.type },
      },
    },
  });

  const branch = await prisma.branch.create({
    data: {
      businessId: business.id,
      name: data.branchName,
      address: data.branchAddress || null,
      isHeadOffice: true,
      isActive: true,
    },
  });

  if (data.storeName) {
    await prisma.store.create({
      data: {
        branchId: branch.id,
        name: data.storeName,
        isActive: true,
      },
    });
  }

  const inventoryLocation = await prisma.inventoryLocation.create({
    data: {
      businessId: business.id,
      name: `${data.branchName} - Main Store`,
      type: "store",
    },
  });

  return { business, branch, inventoryLocation };
}

export function getSetupStepQuestion(step: string): string {
  return stepQuestions[step] || "Tafadhali toa maelezo zaidi.";
}

export async function getWorkspaceId(userId: string): Promise<string | null> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { select: { id: true } } },
  });
  return member?.workspace.id || null;
}
