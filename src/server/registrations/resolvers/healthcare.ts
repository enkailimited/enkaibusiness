import "server-only";

import { type BusinessTypeConfig, type BusinessTypeResolver, type BusinessPricingInfo } from "./types";

export class HealthcareResolver implements BusinessTypeResolver {
  async getConfig(): Promise<BusinessTypeConfig> {
    return {
      slug: "healthcare",
      name: "Healthcare",
      staffUniqueness: "multi",
      defaultPosition: "Doctor",
      subscriptionRequired: true,
      hierarchy: {
        defaultLevel: "facility",
        validLevels: ["facility", "department", "ward"],
      },
    };
  }

  async getValidLevels(): Promise<string[]> {
    return ["facility", "department", "ward"];
  }

  async resolveLevel(input: { branchId?: string | null; storeId?: string | null }): Promise<string> {
    return "facility";
  }

  async getDefaultPricing(): Promise<BusinessPricingInfo> {
    return {
      dailyPrice: 2500,
      setupFee: 120000,
      qrPrintingFee: 0,
      totalSetupFee: 120000,
    };
  }

  async requiresSubscription(): Promise<boolean> {
    return true;
  }
}
