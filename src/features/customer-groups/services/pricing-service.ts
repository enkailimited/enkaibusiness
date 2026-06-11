import "server-only";

import { prisma } from "@/server/db";

type PricingTier = "customer_group" | "promo" | "wholesale" | "retail";

export interface ResolvedPrice {
  itemId: string;
  itemName: string;
  price: number;
  tier: PricingTier;
  sourceName: string;
  currency: string;
}

export async function resolvePrice(
  businessId: string,
  itemId: string,
  customerId?: string,
  quantity: number = 1,
): Promise<ResolvedPrice | null> {
  const item = await prisma.catalogItem.findUnique({
    where: { id: itemId, businessId },
    include: { priceListItems: { include: { priceList: true } } },
  });

  if (!item) return null;

  const basePrice = Number(item.price);
  const currency = item.currency;

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, businessId },
      include: { customerGroup: true },
    });

    if (customer?.customerGroup) {
      const groupPrice = findPriceFromList(
        item.priceListItems.map((pli) => ({
          unitPrice: Number(pli.unitPrice),
          minQuantity: Number(pli.minQuantity),
          priceList: { type: pli.priceList.type, isActive: pli.priceList.isActive, startDate: pli.priceList.startDate, endDate: pli.priceList.endDate },
        })),
        "customer_group",
        quantity,
      );
      if (groupPrice !== null) {
        return {
          itemId,
          itemName: item.name,
          price: groupPrice,
          tier: "customer_group",
          sourceName: `Group: ${customer.customerGroup.name}`,
          currency,
        };
      }
    }
  }

  const promoPrice = findPriceFromList(
    item.priceListItems.map((pli) => ({
      unitPrice: Number(pli.unitPrice),
      minQuantity: Number(pli.minQuantity),
      priceList: { type: pli.priceList.type, isActive: pli.priceList.isActive, startDate: pli.priceList.startDate, endDate: pli.priceList.endDate },
    })),
    "promo",
    quantity,
  );
  if (promoPrice !== null) {
    return { itemId, itemName: item.name, price: promoPrice, tier: "promo", sourceName: "Promotional", currency };
  }

  const wholesalePrice = findPriceFromList(
    item.priceListItems.map((pli) => ({
      unitPrice: Number(pli.unitPrice),
      minQuantity: Number(pli.minQuantity),
      priceList: { type: pli.priceList.type, isActive: pli.priceList.isActive, startDate: pli.priceList.startDate, endDate: pli.priceList.endDate },
    })),
    "wholesale",
    quantity,
  );
  if (wholesalePrice !== null) {
    return { itemId, itemName: item.name, price: wholesalePrice, tier: "wholesale", sourceName: "Wholesale", currency };
  }

  return { itemId, itemName: item.name, price: basePrice, tier: "retail", sourceName: "Retail", currency };
}

function findPriceFromList(
  priceListItems: Array<{
    unitPrice: number;
    minQuantity: number;
    priceList: { type: string; isActive: boolean; startDate?: Date | null; endDate?: Date | null };
  }>,
  type: string,
  quantity: number,
): number | null {
  const matched = priceListItems
    .filter((pli) => pli.priceList.type === type && pli.priceList.isActive)
    .filter((pli) => {
      if (pli.priceList.startDate && new Date(pli.priceList.startDate) > new Date()) return false;
      if (pli.priceList.endDate && new Date(pli.priceList.endDate) < new Date()) return false;
      return true;
    })
    .filter((pli) => quantity >= pli.minQuantity)
    .sort((a, b) => b.unitPrice - a.unitPrice);

  const firstMatch = matched[0];
  return firstMatch ? firstMatch.unitPrice : null;
}

export async function resolvePricesForItems(
  businessId: string,
  itemIds: string[],
  customerId?: string,
): Promise<ResolvedPrice[]> {
  const results: ResolvedPrice[] = [];
  for (const itemId of itemIds) {
    const price = await resolvePrice(businessId, itemId, customerId);
    if (price) results.push(price);
  }
  return results;
}

export async function calculateCartTotal(
  businessId: string,
  items: Array<{ itemId: string; quantity: number }>,
  customerId?: string,
) {
  let subtotal = 0;
  const resolvedPrices: Array<{ itemId: string; price: number; quantity: number; tier: string }> = [];

  for (const item of items) {
    const price = await resolvePrice(businessId, item.itemId, customerId, item.quantity);
    if (price) {
      subtotal += price.price * item.quantity;
      resolvedPrices.push({
        itemId: item.itemId,
        price: price.price,
        quantity: item.quantity,
        tier: price.tier,
      });
    }
  }

  return { subtotal, items: resolvedPrices };
}
