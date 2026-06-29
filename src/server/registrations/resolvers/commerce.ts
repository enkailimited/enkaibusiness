import "server-only";

import { type BusinessTypeConfig, type BusinessTypeResolver, type BusinessPricingInfo } from "./types";

export class CommerceResolver implements BusinessTypeResolver {
  async getConfig(): Promise<BusinessTypeConfig> {
    return {
      slug: "commerce",
      name: "Commerce",
      staffUniqueness: "single",
      defaultPosition: "Owner",
      subscriptionRequired: true,
      hierarchy: {
        defaultLevel: "business",
        validLevels: ["business", "branch", "store"],
      },
    };
  }

  async getValidLevels(): Promise<string[]> {
    return ["business", "branch", "store"];
  }

  async resolveLevel(input: { branchId?: string | null; storeId?: string | null }): Promise<string> {
    if (input.storeId) return "store";
    if (input.branchId) return "branch";
    return "business";
  }

  async getDefaultPricing(): Promise<BusinessPricingInfo> {
    const { QR_CODE_STICKER_COUNT, QR_CODE_STICKER_PRICE } = await import("@/features/subscriptions/constants/pricing");
    const qrPrintingFee = QR_CODE_STICKER_COUNT * QR_CODE_STICKER_PRICE;
    return {
      dailyPrice: 1667,
      setupFee: 80000,
      qrPrintingFee,
      totalSetupFee: 80000 + qrPrintingFee,
    };
  }

  async requiresSubscription(): Promise<boolean> {
    return true;
  }
}
