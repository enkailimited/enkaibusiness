import "server-only";

import {
  type BusinessTypeConfig,
  type BusinessTypeResolver,
  type BusinessPricingInfo,
} from "./types";
import { businessTypeService } from "../business-type/service";
import { CommerceResolver } from "./commerce";
import { HealthcareResolver } from "./healthcare";
import { AgricultureResolver } from "./agriculture";

const RESOLVER_MAP: Record<string, new () => BusinessTypeResolver> = {
  commerce: CommerceResolver,
  healthcare: HealthcareResolver,
  agriculture: AgricultureResolver,
};

export class DbBusinessTypeResolver implements BusinessTypeResolver {
  private resolver: BusinessTypeResolver | null = null;
  private fallback = new CommerceResolver();
  private businessTypeId: string;

  constructor(businessTypeId: string) {
    this.businessTypeId = businessTypeId;
  }

  private async getResolver(): Promise<BusinessTypeResolver> {
    if (this.resolver) return this.resolver;

    const bt = await businessTypeService.findById(this.businessTypeId);
    if (!bt) {
      this.resolver = this.fallback;
      return this.resolver;
    }

    const ResolverClass = RESOLVER_MAP[bt.slug];
    this.resolver = ResolverClass ? new ResolverClass() : this.fallback;
    return this.resolver;
  }

  async getConfig(): Promise<BusinessTypeConfig> {
    const r = await this.getResolver();
    return r.getConfig();
  }

  async getValidLevels(): Promise<string[]> {
    const r = await this.getResolver();
    return r.getValidLevels();
  }

  async resolveLevel(input: {
    branchId?: string | null;
    storeId?: string | null;
  }): Promise<string> {
    const r = await this.getResolver();
    return r.resolveLevel(input);
  }

  async getDefaultPricing(): Promise<BusinessPricingInfo> {
    const r = await this.getResolver();
    return r.getDefaultPricing();
  }

  async requiresSubscription(): Promise<boolean> {
    const r = await this.getResolver();
    return r.requiresSubscription();
  }
}
