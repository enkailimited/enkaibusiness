import "server-only";

import { prisma } from "@/server/db";
import { getIndustry } from "@/server/industry/registry";
import { segmentEngine } from "./segment-engine";

export interface BusinessContext {
  businessId: string;
  name: string;
  industry: string;
  industryName: string;
  modes: string[];
  country: string;
  currency: string;
  taxSystem: string;
  size: "micro" | "small" | "medium" | "large";
  enabledModules: string[];
  pricingStrategy: string;
  inventoryStrategy: string;
  customerSegments: string[];
  features: string[];
}

export class AIContextEngine {
  private contextCache = new Map<string, BusinessContext>();

  async getContext(businessId: string): Promise<BusinessContext> {
    const cached = this.contextCache.get(businessId);
    if (cached) return cached;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        businessType: { select: { slug: true, name: true } },
        modes: { where: { isActive: true }, select: { mode: true, industry: true } },
      },
    });

    if (!business) throw new Error(`Business ${businessId} not found`);

    const industrySlug = business.businessType?.slug ?? "commerce";
    const industry = getIndustry(industrySlug);
    const modes = business.modes.map((m) => m.mode);

    const settings = await prisma.setting.findMany({
      where: {
        businessId,
        key: { in: ["tax.country", "tax.taxName", "business.size"] },
      },
    });

    const getSetting = (key: string, def: string = "") =>
      settings.find((s) => s.key === key)?.value ?? def;

    const country = getSetting("tax.country", "TZ");
    const size = (getSetting("business.size", "small") as BusinessContext["size"]);

    const segments = new Set<string>();
    for (const mode of modes) {
      for (const seg of segmentEngine.getSegmentsByMode(mode)) {
        segments.add(seg);
      }
    }

    const pricingStrategy = modes.includes("wholesale") || modes.includes("distribution")
      ? "tiered-volume"
      : "fixed-retail";

    const inventoryStrategy = modes.includes("distribution")
      ? "distribution"
      : modes.includes("wholesale")
        ? "wholesale"
        : "retail";

    const ctx: BusinessContext = {
      businessId,
      name: business.name,
      industry: industrySlug,
      industryName: business.businessType?.name ?? "Commerce",
      modes,
      country,
      currency: business.currency,
      taxSystem: `${country} ${getSetting("tax.taxName", "VAT")}`,
      size,
      enabledModules: industry?.modules.map((m) => m.slug) ?? [],
      pricingStrategy,
      inventoryStrategy,
      customerSegments: [...segments],
      features: [],
    };

    this.contextCache.set(businessId, ctx);
    return ctx;
  }

  async describeTransaction(
    businessId: string,
    transaction: string,
  ): Promise<string> {
    const ctx = await this.getContext(businessId);
    const modeDescriptions = ctx.modes.join(" + ");

    return [
      `Business: ${ctx.name}`,
      `Industry: ${ctx.industryName}`,
      `Mode(s): ${modeDescriptions}`,
      `Country: ${ctx.country}`,
      `Currency: ${ctx.currency}`,
      `Tax: ${ctx.taxSystem}`,
      `Pricing: ${ctx.pricingStrategy}`,
      `Inventory: ${ctx.inventoryStrategy}`,
      `Customer segments: ${ctx.customerSegments.join(", ")}`,
      `---`,
      `Transaction: ${transaction}`,
      `---`,
      this.getTransactionHint(transaction, ctx),
    ].join("\n");
  }

  invalidateCache(businessId: string): void {
    this.contextCache.delete(businessId);
  }

  private getTransactionHint(transaction: string, ctx: BusinessContext): string {
    const lower = transaction.toLowerCase();

    if (lower.includes("sold") || lower.includes("sale") || lower.includes("sold")) {
      if (ctx.modes.includes("retail"))
        return "This is a retail sale. Use POS/sale flow with individual pricing.";
      if (ctx.modes.includes("wholesale"))
        return "This is a wholesale sale. Use wholesale pricing with bulk discounts.";
      return "Process as a standard sale.";
    }

    if (lower.includes("stock") || lower.includes("inventory") || lower.includes("balance")) {
      if (ctx.inventoryStrategy === "distribution")
        return "Check warehouse and route inventory levels.";
      if (ctx.inventoryStrategy === "wholesale")
        return "Check bulk inventory in cartons/pallets.";
      return "Check shelf inventory levels.";
    }

    if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
      if (ctx.pricingStrategy === "tiered-volume")
        return "Price depends on customer segment and quantity tier.";
      return "Use standard retail price from catalog.";
    }

    if (lower.includes("customer") || lower.includes("client") || lower.includes("who")) {
      return `Customer segments available: ${ctx.customerSegments.join(", ")}`;
    }

    return "";
  }
}

export const aiContextEngine = new AIContextEngine();
