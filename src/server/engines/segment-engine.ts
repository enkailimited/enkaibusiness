import "server-only";

import { prisma } from "@/server/db";
import type { CustomerSegment } from "./types";

export interface SegmentConfig {
  slug: CustomerSegment;
  name: string;
  description: string;
  defaultCreditLimit: number;
  defaultPaymentTerms: number;
  defaultDiscountPercent: number;
  requiresApproval: boolean;
  taxExempt: boolean;
  pricingTier: string;
}

const SEGMENT_CONFIGS: Record<CustomerSegment, SegmentConfig> = {
  retail: {
    slug: "retail",
    name: "Retail Customer",
    description: "Individual retail buyers",
    defaultCreditLimit: 0,
    defaultPaymentTerms: 0,
    defaultDiscountPercent: 0,
    requiresApproval: false,
    taxExempt: false,
    pricingTier: "retail",
  },
  wholesale: {
    slug: "wholesale",
    name: "Wholesale Customer",
    description: "Business bulk buyers",
    defaultCreditLimit: 5000000,
    defaultPaymentTerms: 30,
    defaultDiscountPercent: 5,
    requiresApproval: false,
    taxExempt: false,
    pricingTier: "wholesale",
  },
  distributor: {
    slug: "distributor",
    name: "Distributor",
    description: "Authorized distributors",
    defaultCreditLimit: 20000000,
    defaultPaymentTerms: 45,
    defaultDiscountPercent: 15,
    requiresApproval: true,
    taxExempt: false,
    pricingTier: "distributor",
  },
  dealer: {
    slug: "dealer",
    name: "Dealer",
    description: "Authorized dealers with special pricing",
    defaultCreditLimit: 10000000,
    defaultPaymentTerms: 30,
    defaultDiscountPercent: 10,
    requiresApproval: true,
    taxExempt: false,
    pricingTier: "dealer",
  },
  vip: {
    slug: "vip",
    name: "VIP Customer",
    description: "High-value preferred customers",
    defaultCreditLimit: 15000000,
    defaultPaymentTerms: 30,
    defaultDiscountPercent: 10,
    requiresApproval: false,
    taxExempt: false,
    pricingTier: "vip",
  },
  corporate: {
    slug: "corporate",
    name: "Corporate",
    description: "Corporate accounts",
    defaultCreditLimit: 30000000,
    defaultPaymentTerms: 60,
    defaultDiscountPercent: 8,
    requiresApproval: true,
    taxExempt: false,
    pricingTier: "wholesale",
  },
  government: {
    slug: "government",
    name: "Government",
    description: "Government institutions",
    defaultCreditLimit: 50000000,
    defaultPaymentTerms: 90,
    defaultDiscountPercent: 0,
    requiresApproval: true,
    taxExempt: true,
    pricingTier: "contract",
  },
  export: {
    slug: "export",
    name: "Export",
    description: "Export customers",
    defaultCreditLimit: 100000000,
    defaultPaymentTerms: 60,
    defaultDiscountPercent: 12,
    requiresApproval: true,
    taxExempt: true,
    pricingTier: "wholesale",
  },
  ngo: {
    slug: "ngo",
    name: "NGO",
    description: "Non-governmental organizations",
    defaultCreditLimit: 10000000,
    defaultPaymentTerms: 30,
    defaultDiscountPercent: 5,
    requiresApproval: true,
    taxExempt: true,
    pricingTier: "retail",
  },
  institution: {
    slug: "institution",
    name: "Institution",
    description: "Educational and research institutions",
    defaultCreditLimit: 20000000,
    defaultPaymentTerms: 45,
    defaultDiscountPercent: 5,
    requiresApproval: true,
    taxExempt: false,
    pricingTier: "wholesale",
  },
};

export class SegmentEngine {
  getConfig(segment: CustomerSegment): SegmentConfig {
    return SEGMENT_CONFIGS[segment] ?? SEGMENT_CONFIGS.retail;
  }

  getAllConfigs(): SegmentConfig[] {
    return Object.values(SEGMENT_CONFIGS);
  }

  async resolveCustomerSegment(customerId: string): Promise<SegmentConfig> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { customerGroup: true },
    });
    if (!customer) return SEGMENT_CONFIGS.retail;

    const customerTypeMap: Record<string, CustomerSegment> = {
      RETAIL: "retail",
      WHOLESALE: "wholesale",
      WALK_IN: "retail",
    };

    const baseSegment = customerTypeMap[customer.customerType] ?? "retail";
    const config = this.getConfig(baseSegment);

    if (customer.customerGroup?.discountPercent) {
      return { ...config, defaultDiscountPercent: Number(customer.customerGroup.discountPercent) };
    }

    if (customer.creditLimit) {
      return { ...config, defaultCreditLimit: Number(customer.creditLimit) };
    }

    return config;
  }

  async resolveBusinessSegments(businessId: string): Promise<SegmentConfig[]> {
    const groups = await prisma.customerGroup.findMany({
      where: { businessId },
      select: { name: true, discountPercent: true, isDefault: true },
    });

    const segments = this.getAllConfigs();
    return segments.map((seg) => {
      const matchingGroup = groups.find(
        (g) => g.name.toLowerCase() === seg.name.toLowerCase(),
      );
      if (matchingGroup) {
        return {
          ...seg,
          defaultDiscountPercent: matchingGroup.discountPercent
            ? Number(matchingGroup.discountPercent)
            : seg.defaultDiscountPercent,
        };
      }
      return seg;
    });
  }

  getSegmentsByMode(mode: string): CustomerSegment[] {
    switch (mode) {
      case "retail":
        return ["retail", "vip", "corporate", "government", "institution"];
      case "wholesale":
        return ["wholesale", "distributor", "dealer", "corporate", "government", "export", "ngo"];
      case "retail-wholesale":
        return ["retail", "wholesale", "distributor", "dealer", "vip", "corporate", "government", "export", "ngo", "institution"];
      case "distribution":
        return ["distributor", "dealer", "wholesale", "corporate"];
      case "ecommerce":
        return ["retail", "vip", "corporate"];
      default:
        return ["retail", "wholesale", "corporate"];
    }
  }
}

export const segmentEngine = new SegmentEngine();
