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

function resolvePriceFromItem(
  item: {
    id: string;
    name: string;
    price: unknown;
    currency: string;
    priceListItems: Array<{
      unitPrice: unknown;
      minQuantity: unknown;
      priceList: { type: string; isActive: boolean; startDate?: Date | null; endDate?: Date | null };
    }>;
  },
  quantity: number,
  customerGroupName?: string,
): ResolvedPrice {
  const basePrice = Number(item.price);
  const currency = item.currency;

  const priceListItems = item.priceListItems.map((pli) => ({
    unitPrice: Number(pli.unitPrice),
    minQuantity: Number(pli.minQuantity),
    priceList: { type: pli.priceList.type, isActive: pli.priceList.isActive, startDate: pli.priceList.startDate, endDate: pli.priceList.endDate },
  }));

  if (customerGroupName) {
    const groupPrice = findPriceFromList(priceListItems, "customer_group", quantity);
    if (groupPrice !== null) {
      return { itemId: item.id, itemName: item.name, price: groupPrice, tier: "customer_group", sourceName: `Group: ${customerGroupName}`, currency };
    }
  }

  const promoPrice = findPriceFromList(priceListItems, "promo", quantity);
  if (promoPrice !== null) {
    return { itemId: item.id, itemName: item.name, price: promoPrice, tier: "promo", sourceName: "Promotional", currency };
  }

  const wholesalePrice = findPriceFromList(priceListItems, "wholesale", quantity);
  if (wholesalePrice !== null) {
    return { itemId: item.id, itemName: item.name, price: wholesalePrice, tier: "wholesale", sourceName: "Wholesale", currency };
  }

  return { itemId: item.id, itemName: item.name, price: basePrice, tier: "retail", sourceName: "Retail", currency };
}

export async function resolvePricesForItems(
  businessId: string,
  itemIds: string[],
  customerId?: string,
): Promise<ResolvedPrice[]> {
  const items = await prisma.catalogItem.findMany({
    where: { id: { in: itemIds }, businessId },
    include: { priceListItems: { include: { priceList: true } } },
  });
  const itemMap = new Map(items.map(i => [i.id, i]));

  let customerGroupName: string | undefined;
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, businessId },
      select: { customerGroup: { select: { name: true } } },
    });
    customerGroupName = customer?.customerGroup?.name;
  }

  const results: ResolvedPrice[] = [];
  for (const itemId of itemIds) {
    const item = itemMap.get(itemId);
    if (!item) continue;
    const resolved = resolvePriceFromItem(item, 1, customerGroupName);
    results.push(resolved);
  }
  return results;
}

export async function calculateCartTotal(
  businessId: string,
  items: Array<{ itemId: string; quantity: number }>,
  customerId?: string,
) {
  const uniqueItemIds = [...new Set(items.map(i => i.itemId))];
  const catalogItems = await prisma.catalogItem.findMany({
    where: { id: { in: uniqueItemIds }, businessId },
    include: { priceListItems: { include: { priceList: true } } },
  });
  const itemMap = new Map(catalogItems.map(i => [i.id, i]));

  let customerGroupName: string | undefined;
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, businessId },
      select: { customerGroup: { select: { name: true } } },
    });
    customerGroupName = customer?.customerGroup?.name;
  }

  let subtotal = 0;
  const resolvedPrices: Array<{ itemId: string; price: number; quantity: number; tier: string }> = [];

  for (const { itemId, quantity } of items) {
    const item = itemMap.get(itemId);
    if (!item) continue;
    const price = resolvePriceFromItem(item, quantity, customerGroupName);
    subtotal += price.price * quantity;
    resolvedPrices.push({ itemId, price: price.price, quantity, tier: price.tier });
  }

  return { subtotal, items: resolvedPrices };
}
