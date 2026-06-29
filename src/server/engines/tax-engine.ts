import "server-only";

import { prisma } from "@/server/db";
import type { TaxType, TaxMode, TaxLine, TaxCalculation } from "./types";

const COUNTRY_TAX_RULES: Record<string, Array<{ type: TaxType; name: string; rate: number; isCompound: boolean }>> = {
  TZ: [
    { type: "vat", name: "VAT 18%", rate: 0.18, isCompound: false },
    { type: "withholding", name: "Withholding Tax 5%", rate: 0.05, isCompound: false },
  ],
  KE: [
    { type: "vat", name: "VAT 16%", rate: 0.16, isCompound: false },
  ],
  UG: [
    { type: "vat", name: "VAT 18%", rate: 0.18, isCompound: false },
  ],
  NG: [
    { type: "vat", name: "VAT 7.5%", rate: 0.075, isCompound: false },
  ],
  ZA: [
    { type: "vat", name: "VAT 15%", rate: 0.15, isCompound: false },
  ],
};

export interface TaxRequest {
  businessId: string;
  customerId?: string;
  items: Array<{
    catalogItemId: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    taxExempt?: boolean;
  }>;
  subtotal: number;
  taxMode?: TaxMode;
  countryCode?: string;
  isExport?: boolean;
}

export class TaxEngine {
  async calculate(request: TaxRequest): Promise<TaxCalculation> {
    const business = await prisma.business.findUnique({
      where: { id: request.businessId },
      select: { currency: true },
    });

    const countryCode = request.countryCode || "TZ";
    const taxMode = request.taxMode || "exclusive";
    const taxLines: TaxLine[] = [];

    if (request.isExport) {
      return {
        lines: [],
        subtotal: request.subtotal,
        totalTax: 0,
        grandTotal: request.subtotal,
        taxMode,
      };
    }

    for (const item of request.items) {
      const itemTotal = item.quantity * item.unitPrice;

      if (item.taxExempt) continue;

      const effectiveRate = item.taxRate !== undefined ? item.taxRate / 100 : this.getDefaultTaxRate(countryCode);

      if (effectiveRate > 0) {
        taxLines.push({
          type: "vat",
          name: `VAT ${(effectiveRate * 100).toFixed(1)}%`,
          rate: effectiveRate,
          amount: itemTotal * effectiveRate,
          taxableAmount: itemTotal,
          isCompound: false,
        });
      }
    }

    const countryRules = this.getCountryRules(countryCode);
    for (const rule of countryRules) {
      if (rule.type === "vat") continue;

      const totalBefore = taxLines.reduce((s, l) => s + l.taxableAmount, 0);
      let taxableAmount = totalBefore;
      if (rule.isCompound) {
        taxableAmount += taxLines.reduce((s, l) => s + l.amount, 0);
      }

      taxLines.push({
        type: rule.type,
        name: rule.name,
        rate: rule.rate,
        amount: taxableAmount * rule.rate,
        taxableAmount,
        isCompound: rule.isCompound,
      });
    }

    const totalTax = taxLines.reduce((s, l) => s + l.amount, 0);

    return {
      lines: taxLines,
      subtotal: request.subtotal,
      totalTax,
      grandTotal: taxMode === "inclusive" ? request.subtotal : request.subtotal + totalTax,
      taxMode,
    };
  }

  async splitTaxByItem(params: {
    businessId: string;
    items: Array<{
      catalogItemId: string;
      quantity: number;
      unitPrice: number;
    }>;
    countryCode?: string;
    isExport?: boolean;
  }): Promise<TaxCalculation[]> {
    return Promise.all(
      params.items.map(async (item) => {
        const catalogItem = await prisma.catalogItem.findUnique({
          where: { id: item.catalogItemId },
          select: { taxRate: true, name: true },
        });

        return this.calculate({
          businessId: params.businessId,
          items: [{
            catalogItemId: item.catalogItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: catalogItem?.taxRate ?? undefined,
          }],
          subtotal: item.quantity * item.unitPrice,
          countryCode: params.countryCode,
          isExport: params.isExport,
        });
      }),
    );
  }

  getCountryRules(countryCode: string): Array<{ type: TaxType; name: string; rate: number; isCompound: boolean }> {
    return COUNTRY_TAX_RULES[countryCode] ?? COUNTRY_TAX_RULES.TZ;
  }

  private getDefaultTaxRate(countryCode: string): number {
    const rules = COUNTRY_TAX_RULES[countryCode] ?? COUNTRY_TAX_RULES.TZ;
    const vatRule = rules.find((r) => r.type === "vat");
    return vatRule?.rate ?? 0;
  }

  async getBusinessTaxConfig(businessId: string): Promise<{
    countryCode: string;
    taxMode: TaxMode;
    taxRates: Array<{ type: TaxType; name: string; rate: number }>;
    tin: string | null;
    isVATRegistered: boolean;
  }> {
    const settings = await prisma.setting.findMany({
      where: { businessId, key: { startsWith: "tax." } },
    });

    const getSetting = (key: string, defaultValue: string = "") =>
      settings.find((s) => s.key === key)?.value ?? defaultValue;

    const countryCode = getSetting("tax.country", "TZ");
    const taxMode = (getSetting("tax.mode", "exclusive") as TaxMode);

    return {
      countryCode,
      taxMode,
      taxRates: COUNTRY_TAX_RULES[countryCode] ?? COUNTRY_TAX_RULES.TZ,
      tin: getSetting("tax.tin", null),
      isVATRegistered: getSetting("tax.isVATRegistered", "false") === "true",
    };
  }
}

export const taxEngine = new TaxEngine();
