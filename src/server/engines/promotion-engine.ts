import "server-only";

import { prisma } from "@/server/db";
import type { PromotionType, PromotionResult, CustomerSegment } from "./types";

export interface PromotionRequest {
  businessId: string;
  customerId?: string;
  customerSegment?: CustomerSegment;
  items: Array<{
    catalogItemId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  date?: Date;
  promoCode?: string;
  branchId?: string;
}

export class PromotionEngine {
  async applyPromotions(request: PromotionRequest): Promise<{
    promotions: PromotionResult[];
    totalDiscount: number;
    finalSubtotal: number;
  }> {
    const now = request.date || new Date();
    const promotions: PromotionResult[] = [];

    if (request.promoCode) {
      const promoPromotion = await this.applyPromoCode(request.promoCode, request);
      if (promoPromotion) promotions.push(promoPromotion);
    }

    const itemPromotions = await this.applyItemPromotions(request);
    promotions.push(...itemPromotions);

    const segmentPromotion = await this.applySegmentPromotion(request);
    if (segmentPromotion) promotions.push(segmentPromotion);

    const sorted = promotions.sort((a, b) => b.priority - a.priority);
    const stackable = sorted.filter((p) => p.stackable);
    const nonStackable = sorted.filter((p) => !p.stackable);
    const winners = nonStackable.length ? [nonStackable[0]] : [];
    const finalPromotions = [...winners, ...stackable];

    let totalDiscount = 0;
    let remaining = request.subtotal;

    for (const promo of finalPromotions) {
      if (promo.type === "discount-percent") {
        const discount = remaining * (promo.discountPercent / 100);
        totalDiscount += discount;
        remaining -= discount;
      } else if (promo.type === "discount-amount") {
        const discount = Math.min(promo.discountAmount, remaining);
        totalDiscount += discount;
        remaining -= discount;
      }
    }

    return {
      promotions: finalPromotions,
      totalDiscount,
      finalSubtotal: request.subtotal - totalDiscount,
    };
  }

  private async applyPromoCode(
    code: string,
    request: PromotionRequest,
  ): Promise<PromotionResult | null> {
    const campaign = await prisma.distributionCampaign.findFirst({
      where: {
        businessId: request.businessId,
        slug: code.toLowerCase(),
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: request.date || new Date() } }] },
          { OR: [{ endDate: null }, { endDate: { gte: request.date || new Date() } }] },
        ],
      },
    });

    if (!campaign) return null;

    return {
      promotionId: campaign.id,
      name: campaign.name,
      type: "promo-code",
      discountAmount: request.subtotal * 0.1,
      discountPercent: 10,
      priority: 50,
      stackable: false,
    };
  }

  private async applyItemPromotions(
    request: PromotionRequest,
  ): Promise<PromotionResult[]> {
    const results: PromotionResult[] = [];
    const now = request.date || new Date();

    const promoPriceLists = await prisma.priceList.findMany({
      where: {
        businessId: request.businessId,
        type: "promo",
        isActive: true,
        startDate: { lte: now },
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      include: {
        items: {
          where: {
            catalogItemId: { in: request.items.map((i) => i.catalogItemId) },
          },
        },
      },
      orderBy: { priority: "desc" },
    });

    for (const list of promoPriceLists) {
      for (const item of list.items) {
        const requestItem = request.items.find((i) => i.catalogItemId === item.catalogItemId);
        if (!requestItem) continue;

        const listPrice = Number(item.unitPrice);
        const discountPerUnit = requestItem.unitPrice - listPrice;

        if (discountPerUnit > 0) {
          results.push({
            promotionId: list.id,
            name: list.name,
            type: "discount-amount",
            discountAmount: discountPerUnit * requestItem.quantity,
            discountPercent: (discountPerUnit / requestItem.unitPrice) * 100,
            priority: list.priority || 30,
            stackable: true,
          });
        }
      }
    }

    return results;
  }

  private async applySegmentPromotion(
    request: PromotionRequest,
  ): Promise<PromotionResult | null> {
    if (!request.customerSegment) return null;

    const segmentDiscounts: Record<string, { percent: number; priority: number }> = {
      wholesale: { percent: 5, priority: 20 },
      distributor: { percent: 15, priority: 20 },
      dealer: { percent: 10, priority: 20 },
      vip: { percent: 10, priority: 25 },
      corporate: { percent: 8, priority: 20 },
    };

    const discount = segmentDiscounts[request.customerSegment];
    if (!discount) return null;

    return {
      promotionId: `segment-${request.customerSegment}`,
      name: `${request.customerSegment} discount`,
      type: "discount-percent",
      discountAmount: request.subtotal * (discount.percent / 100),
      discountPercent: discount.percent,
      priority: discount.priority,
      stackable: false,
    };
  }

  async validateCoupon(code: string, businessId: string): Promise<{
    valid: boolean;
    message: string;
    discountPercent?: number;
  }> {
    const campaign = await prisma.distributionCampaign.findFirst({
      where: { businessId, slug: code.toLowerCase(), isActive: true },
    });

    if (!campaign) return { valid: false, message: "Invalid coupon code" };

    const now = new Date();
    if (campaign.startDate && campaign.startDate > now) {
      return { valid: false, message: "Coupon not yet active" };
    }
    if (campaign.endDate && campaign.endDate < now) {
      return { valid: false, message: "Coupon has expired" };
    }

    return { valid: true, message: "Coupon applied", discountPercent: 10 };
  }
}

export const promotionEngine = new PromotionEngine();
