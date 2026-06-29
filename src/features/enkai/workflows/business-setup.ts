import "server-only";

import { prisma } from "@/server/db";
import { BusinessRegistrationEngine } from "@/server/registrations";

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
  const result = await BusinessRegistrationEngine.register(
    {
      name: data.name,
      slug: `${data.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      workspaceId,
      createdById: userId,
      currency: data.currency || "TZS",
      industry: (data.industry || data.type) as any,
      modes: [data.type],
      planId: "",
      businessSize: "small",
    },
    { id: "", amount: 0, interval: "MONTHLY", name: "Free" },
    { dailyPrice: 0, setupFee: 0, qrPrintingFee: 0, totalSetupFee: 0 },
  );

  if (!result.success) {
    throw new Error(result.message);
  }

  const businessId = result.data!.businessId;

  const branch = await prisma.branch.create({
    data: {
      businessId,
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
      businessId,
      name: `${data.branchName} - Main Store`,
      type: "store",
    },
  });

  const business = await prisma.business.findUnique({ where: { id: businessId } });

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
