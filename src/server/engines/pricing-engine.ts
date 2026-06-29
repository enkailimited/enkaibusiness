import "server-only";

import { prisma } from "@/server/db";
import type { PriceType, PriceResult, CustomerSegment } from "./types";
import { segmentEngine } from "./segment-engine";

export interface PriceRequest {
  catalogItemId: string;
  businessId: string;
  customerId?: string;
  customerSegment?: CustomerSegment;
  quantity: number;
  unitId?: string;
  branchId?: string;
  locationId?: string;
  currency?: string;
  date?: Date;
  campaignId?: string;
  promoCode?: string;
}

export class PricingEngine {
  async resolvePrice(request: PriceRequest): Promise<PriceResult> {
    const { catalogItemId, businessId, customerId, quantity, branchId, currency } = request;

    const item = await prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
      select: {
        id: true,
        price: true,
        costPrice: true,
        taxRate: true,
        currency: true,
      },
    });

    if (!item) throw new Error(`Catalog item ${catalogItemId} not found`);

    const itemCurrency = currency || item.currency || "TZS";

    let segment: CustomerSegment | undefined = request.customerSegment;
    if (!segment && customerId) {
      const config = await segmentEngine.resolveCustomerSegment(customerId);
      segment = config.slug;
    }

    const priceLists = await this.getApplicablePriceLists(
      businessId, catalogItemId, segment, quantity, branchId, request.date || new Date(),
    );

    for (const pl of priceLists) {
      const resolved = await this.resolveFromPriceList(pl, catalogItemId, quantity, segment);
      if (resolved) {
        return this.buildResult(resolved, item, itemCurrency);
      }
    }

    const basePrice = Number(item.price);
    let unitPrice = this.applySegmentMultiplier(basePrice, segment);

    if (segment === "wholesale" || segment === "distributor" || segment === "dealer") {
      unitPrice = this.applyVolumeDiscount(unitPrice, quantity);
    }

    return {
      unitPrice,
      priceType: this.segmentToPriceType(segment),
      taxRate: item.taxRate ? Number(item.taxRate) : 0,
      taxAmount: 0,
      total: unitPrice * quantity,
      currency: itemCurrency,
    };
  }

  async resolvePrices(request: PriceRequest[]): Promise<PriceResult[]> {
    return Promise.all(request.map((r) => this.resolvePrice(r)));
  }

  private async getApplicablePriceLists(
    businessId: string,
    catalogItemId: string,
    segment?: CustomerSegment,
    quantity?: number,
    branchId?: string,
    date?: Date,
  ) {
    const now = date || new Date();

    const lists = await prisma.priceList.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      include: {
        items: {
          where: { catalogItemId },
          orderBy: [{ minQuantity: "asc" }],
        },
      },
      orderBy: [{ priority: "desc" }],
    });

    return lists.filter((list) => {
      if (!list.items.length) return false;
      if (list.customerType && segment && list.customerType !== segment.toUpperCase()) return false;
      return true;
    });
  }

  private async resolveFromPriceList(
    priceList: any,
    catalogItemId: string,
    quantity: number,
    segment?: CustomerSegment,
  ): Promise<{
    unitPrice: number;
    priceType: string;
    priceListId: string;
    priceListItemId: string;
    discountPercent: number;
  } | null> {
    const matchingItems = priceList.items.filter(
      (item: any) => Number(item.minQuantity) <= quantity,
    );

    if (!matchingItems.length) return null;

    const bestItem = matchingItems[matchingItems.length - 1];

    return {
      unitPrice: Number(bestItem.unitPrice),
      priceType: priceList.type,
      priceListId: priceList.id,
      priceListItemId: bestItem.id,
      discountPercent: 0,
    };
  }

  private applySegmentMultiplier(basePrice: number, segment?: CustomerSegment): number {
    const multipliers: Record<string, number> = {
      retail: 1.0,
      wholesale: 0.85,
      distributor: 0.7,
      dealer: 0.75,
      vip: 0.9,
      corporate: 0.8,
      government: 0.95,
      export: 0.75,
      ngo: 0.9,
      institution: 0.85,
    };
    return basePrice * (multipliers[segment ?? "retail"] ?? 1.0);
  }

  private applyVolumeDiscount(price: number, quantity: number): number {
    if (quantity >= 1000) return price * 0.7;
    if (quantity >= 500) return price * 0.75;
    if (quantity >= 100) return price * 0.8;
    if (quantity >= 50) return price * 0.85;
    if (quantity >= 10) return price * 0.9;
    return price;
  }

  private segmentToPriceType(segment?: CustomerSegment): PriceType {
    const map: Record<string, PriceType> = {
      retail: "retail",
      wholesale: "wholesale",
      distributor: "distributor",
      dealer: "dealer",
      vip: "vip",
      corporate: "wholesale",
      government: "contract",
      export: "wholesale",
      ngo: "retail",
      institution: "wholesale",
    };
    return map[segment ?? "retail"] as PriceType;
  }

  private buildResult(
    resolved: any,
    item: { price: number; costPrice?: number | null; taxRate?: number | null; currency: string },
    currency: string,
  ): PriceResult {
    const quantity = 1;
    const unitPrice = resolved.unitPrice;
    return {
      unitPrice,
      priceType: resolved.priceType as PriceType,
      priceListId: resolved.priceListId,
      priceListItemId: resolved.priceListItemId,
      taxRate: item.taxRate ? Number(item.taxRate) : 0,
      taxAmount: 0,
      total: unitPrice * quantity,
      currency,
    };
  }
}

export const pricingEngine = new PricingEngine();
