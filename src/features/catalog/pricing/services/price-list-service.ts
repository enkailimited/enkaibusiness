import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePriceListSchema, UpdatePriceListSchema } from "../schemas";
import type { PriceListWithItems } from "../types";

const priceListInclude = {
  items: {
    include: {
      catalogItem: {
        select: { id: true, name: true, sku: true, imageUrl: true },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

export async function createPriceList(
  businessId: string,
  data: CreatePriceListSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { items, startDate, endDate, ...listData } = data;

    const priceList = await prisma.priceList.create({
      data: {
        ...listData,
        businessId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        items: items && items.length > 0
          ? {
              create: items.map((item) => ({
                catalogItemId: item.catalogItemId,
                variantId: item.variantId || null,
                unitPrice: item.unitPrice,
                minQuantity: item.minQuantity ?? 1,
              })),
            }
          : undefined,
      },
    });

    return {
      success: true,
      message: "Price list created successfully",
      data: { id: priceList.id },
    };
  } catch (error) {
    console.error("Create price list error:", error);
    return { success: false, message: "Failed to create price list" };
  }
}

export async function updatePriceList(
  id: string,
  data: UpdatePriceListSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = { ...data };

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    await prisma.priceList.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Price list updated successfully" };
  } catch (error) {
    console.error("Update price list error:", error);
    return { success: false, message: "Failed to update price list" };
  }
}

export async function getPriceList(id: string) {
  return prisma.priceList.findUnique({
    where: { id },
    include: priceListInclude,
  }) as Promise<PriceListWithItems | null>;
}

export async function listPriceLists(
  businessId: string,
  options?: { type?: string; isActive?: boolean },
): Promise<PriceListWithItems[]> {
  const where: Record<string, unknown> = { businessId };

  if (options?.type) where.type = options.type;
  if (options?.isActive !== undefined) where.isActive = options.isActive;

  const lists = await prisma.priceList.findMany({
    where,
    include: priceListInclude,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return lists as unknown as PriceListWithItems[];
}

export async function deletePriceList(id: string): Promise<ActionResponse> {
  try {
    await prisma.priceList.delete({ where: { id } });
    return { success: true, message: "Price list deleted successfully" };
  } catch (error) {
    console.error("Delete price list error:", error);
    return { success: false, message: "Failed to delete price list" };
  }
}

export async function addPriceListItem(
  priceListId: string,
  data: { catalogItemId: string; variantId?: string; unitPrice: number; minQuantity?: number },
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const item = await prisma.priceListItem.create({
      data: {
        priceListId,
        catalogItemId: data.catalogItemId,
        variantId: data.variantId || null,
        unitPrice: data.unitPrice,
        minQuantity: data.minQuantity ?? 1,
      },
    });

    return {
      success: true,
      message: "Item added to price list",
      data: { id: item.id },
    };
  } catch (error) {
    console.error("Add price list item error:", error);
    return { success: false, message: "Failed to add item to price list" };
  }
}

export async function removePriceListItem(itemId: string): Promise<ActionResponse> {
  try {
    await prisma.priceListItem.delete({ where: { id: itemId } });
    return { success: true, message: "Item removed from price list" };
  } catch (error) {
    console.error("Remove price list item error:", error);
    return { success: false, message: "Failed to remove item from price list" };
  }
}

export async function updatePriceListItem(
  itemId: string,
  data: { unitPrice?: number; minQuantity?: number },
): Promise<ActionResponse> {
  try {
    await prisma.priceListItem.update({
      where: { id: itemId },
      data,
    });
    return { success: true, message: "Price list item updated" };
  } catch (error) {
    console.error("Update price list item error:", error);
    return { success: false, message: "Failed to update price list item" };
  }
}
