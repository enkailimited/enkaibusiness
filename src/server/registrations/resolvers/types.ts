import "server-only";

export interface BusinessTypeConfig {
  slug: string;
  name: string;
  staffUniqueness: "single" | "multi";
  defaultPosition: string;
  subscriptionRequired: boolean;
  hierarchy: {
    defaultLevel: string;
    validLevels: string[];
  };
}

export interface BusinessPricingInfo {
  dailyPrice: number;
  setupFee: number;
  qrPrintingFee: number;
  totalSetupFee: number;
}

export interface BusinessTypeResolver {
  getConfig(): Promise<BusinessTypeConfig>;
  getValidLevels(): Promise<string[]>;
  resolveLevel(input: { branchId?: string | null; storeId?: string | null }): Promise<string>;
  getDefaultPricing(): Promise<BusinessPricingInfo>;
  requiresSubscription(): Promise<boolean>;
}
