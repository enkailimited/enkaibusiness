import "server-only";

import { type BusinessTypeConfig, type BusinessTypeResolver, type BusinessPricingInfo } from "./types";

export class MiningResolver implements BusinessTypeResolver {
  async getConfig(): Promise<BusinessTypeConfig> {
    return {
      slug: "mining",
      name: "Mining",
      staffUniqueness: "single",
      defaultPosition: "Owner",
      subscriptionRequired: true,
      hierarchy: {
        defaultLevel: "business",
        validLevels: ["business"],
      },
    };
  }

  async getValidLevels(): Promise<string[]> {
    return ["business"];
  }

  async resolveLevel(_input: { branchId?: string | null; storeId?: string | null }): Promise<string> {
    return "business";
  }

  async getDefaultPricing(): Promise<BusinessPricingInfo> {
    const { QR_CODE_STICKER_COUNT, QR_CODE_STICKER_PRICE } = await import("@/features/subscriptions/constants/pricing");
    const qrPrintingFee = QR_CODE_STICKER_COUNT * QR_CODE_STICKER_PRICE;
    return {
      dailyPrice: 5000,
      setupFee: 150000,
      qrPrintingFee,
      totalSetupFee: 150000 + qrPrintingFee,
    };
  }

  async requiresSubscription(): Promise<boolean> {
    return true;
  }
}
