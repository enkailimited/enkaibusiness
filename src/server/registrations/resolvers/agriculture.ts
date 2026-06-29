import "server-only";

import { type BusinessTypeConfig, type BusinessTypeResolver, type BusinessPricingInfo } from "./types";

export class AgricultureResolver implements BusinessTypeResolver {
  async getConfig(): Promise<BusinessTypeConfig> {
    return {
      slug: "agriculture",
      name: "Agriculture",
      staffUniqueness: "single",
      defaultPosition: "Farmer",
      subscriptionRequired: false,
      hierarchy: {
        defaultLevel: "farm",
        validLevels: ["farm", "field"],
      },
    };
  }

  async getValidLevels(): Promise<string[]> {
    return ["farm", "field"];
  }

  async resolveLevel(input: { branchId?: string | null; storeId?: string | null }): Promise<string> {
    return "farm";
  }

  async getDefaultPricing(): Promise<BusinessPricingInfo> {
    return {
      dailyPrice: 0,
      setupFee: 0,
      qrPrintingFee: 0,
      totalSetupFee: 0,
    };
  }

  async requiresSubscription(): Promise<boolean> {
    return false;
  }
}
