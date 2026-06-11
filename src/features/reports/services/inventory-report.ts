import "server-only";

import { prisma } from "@/server/db";
import type { DateRange, InventoryReport, LowStockItem, LocationValue, ExpiringItem } from "../types";

export async function getInventorySummary(
  businessId: string,
): Promise<InventoryReport> {
  const locations = await prisma.inventoryLocation.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true },
  });

  const locationIds = locations.map((l) => l.id);

  const [balanceData, itemCount, lowStockItems, expiringItems, stockMovements] =
    await Promise.all([
      prisma.inventoryBalance.aggregate({
        where: { locationId: { in: locationIds } },
        _sum: { quantityOnHand: true },
      }),
      prisma.inventoryBalance.count({
        where: { locationId: { in: locationIds } },
      }),
      prisma.inventoryBalance.findMany({
        where: {
          locationId: { in: locationIds },
          quantityOnHand: { lte: prisma.inventoryBalance.fields.reorderPoint },
          quantityOnHand: { gt: 0 },
        },
        include: {
          catalogItem: { select: { id: true, name: true, sku: true } },
          location: { select: { id: true, name: true } },
        },
        orderBy: { quantityOnHand: "asc" },
        take: 50,
      }),
      prisma.inventoryBalance.findMany({
        where: {
          locationId: { in: locationIds },
          expiryDate: {
            not: null,
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          catalogItem: { select: { id: true, name: true, sku: true } },
          location: { select: { id: true, name: true } },
        },
        orderBy: { expiryDate: "asc" },
        take: 50,
      }),
      prisma.stockMovement.aggregate({
        where: {
          locationId: { in: locationIds },
          referenceType: "sale",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { quantityChange: true },
      }),
    ]);

  const totalStockQty = Number(balanceData._sum.quantityOnHand) || 0;

  const turnover =
    totalStockQty > 0
      ? Math.abs(Number(stockMovements._sum.quantityChange) || 0) / totalStockQty
      : 0;

  return {
    summary: {
      totalItems: itemCount,
      totalStockValue: totalStockQty,
      lowStockCount: lowStockItems.length,
      expiringCount: expiringItems.length,
      totalLocations: locations.length,
    },
    lowStock: lowStockItems.map((i) => ({
      id: i.id,
      itemName: i.catalogItem.name,
      sku: i.catalogItem.sku,
      quantityOnHand: Number(i.quantityOnHand),
      reorderPoint: Number(i.reorderPoint),
      locationName: i.location.name,
    })),
    stockValueByLocation: [],
    expiringItems: expiringItems.map((i) => ({
      id: i.id,
      itemName: i.catalogItem.name,
      sku: i.catalogItem.sku,
      batchNo: i.batchNo,
      quantity: Number(i.quantityOnHand),
      expiryDate: i.expiryDate?.toISOString() ?? "",
      locationName: i.location.name,
    })),
    turnover,
  };
}

export async function getLowStockItems(
  businessId: string,
): Promise<LowStockItem[]> {
  const locations = await prisma.inventoryLocation.findMany({
    where: { businessId, isActive: true },
    select: { id: true },
  });

  const items = await prisma.inventoryBalance.findMany({
    where: {
      locationId: { in: locations.map((l) => l.id) },
      quantityOnHand: { lte: prisma.inventoryBalance.fields.reorderPoint },
    },
    include: {
      catalogItem: { select: { id: true, name: true, sku: true } },
      location: { select: { id: true, name: true } },
    },
    orderBy: { quantityOnHand: "asc" },
    take: 100,
  });

  return items.map((i) => ({
    id: i.id,
    itemName: i.catalogItem.name,
    sku: i.catalogItem.sku,
    quantityOnHand: Number(i.quantityOnHand),
    reorderPoint: Number(i.reorderPoint),
    locationName: i.location.name,
  }));
}

export async function getStockValueByLocation(
  businessId: string,
): Promise<LocationValue[]> {
  const locations = await prisma.inventoryLocation.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true },
  });

  const result: LocationValue[] = [];
  for (const loc of locations) {
    const agg = await prisma.inventoryBalance.aggregate({
      where: { locationId: loc.id },
      _sum: { quantityOnHand: true },
      _count: true,
    });
    result.push({
      locationId: loc.id,
      locationName: loc.name,
      stockValue: Number(agg._sum.quantityOnHand) || 0,
      itemCount: agg._count,
    });
  }

  return result;
}

export async function getExpiringItems(
  businessId: string,
  daysAhead = 30,
): Promise<ExpiringItem[]> {
  const items = await prisma.inventoryBalance.findMany({
    where: {
      expiryDate: {
        not: null,
        lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
      },
      location: { businessId, isActive: true },
    },
    include: {
      catalogItem: { select: { id: true, name: true, sku: true } },
      location: { select: { id: true, name: true } },
    },
    orderBy: { expiryDate: "asc" },
    take: 100,
  });

  return items.map((i) => ({
    id: i.id,
    itemName: i.catalogItem.name,
    sku: i.catalogItem.sku,
    batchNo: i.batchNo,
    quantity: Number(i.quantityOnHand),
    expiryDate: i.expiryDate?.toISOString() ?? "",
    locationName: i.location.name,
  }));
}

export async function getStockTurnover(
  businessId: string,
  periodDays = 30,
): Promise<number> {
  const locations = await prisma.inventoryLocation.findMany({
    where: { businessId, isActive: true },
    select: { id: true },
  });

  const locationIds = locations.map((l) => l.id);

  const [avgStock, outgoing] = await Promise.all([
    prisma.inventoryBalance.aggregate({
      where: { locationId: { in: locationIds } },
      _avg: { quantityOnHand: true },
    }),
    prisma.stockMovement.aggregate({
      where: {
        locationId: { in: locationIds },
        referenceType: "sale",
        createdAt: { gte: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) },
      },
      _sum: { quantityChange: true },
    }),
  ]);

  const avg = Number(avgStock._avg.quantityOnHand) || 1;
  const sold = Math.abs(Number(outgoing._sum.quantityChange) || 0);

  return sold / avg;
}
