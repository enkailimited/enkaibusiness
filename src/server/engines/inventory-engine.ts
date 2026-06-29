import "server-only";

import { prisma } from "@/server/db";
import type { InventoryStrategy } from "./types";
import { uomEngine } from "./uom-engine";

export interface InventoryRequest {
  businessId: string;
  catalogItemId: string;
  quantity: number;
  unitId?: string;
  locationId?: string;
  branchId?: string;
  strategy?: InventoryStrategy;
}

export interface StockReservation {
  id: string;
  catalogItemId: string;
  locationId: string;
  quantity: number;
  reference: string;
  referenceType: string;
  expiresAt?: Date;
}

export class InventoryEngine {
  async checkAvailability(request: InventoryRequest): Promise<{
    available: boolean;
    quantityAvailable: number;
    quantityOnHand: number;
    locationId: string | null;
  }> {
    const item = await prisma.catalogItem.findUnique({
      where: { id: request.catalogItemId },
      select: { trackStock: true, unitId: true },
    });
    if (!item || !item.trackStock) {
      return { available: true, quantityAvailable: 999999, quantityOnHand: 999999, locationId: null };
    }

    let baseQuantity = request.quantity;
    if (request.unitId && request.unitId !== item.unitId) {
      const converted = await uomEngine.convert({
        businessId: request.businessId,
        fromUnitId: request.unitId,
        toUnitId: item.unitId!,
        quantity: request.quantity,
      });
      baseQuantity = converted.convertedQuantity;
    }

    const locationId = request.locationId || await this.resolveDefaultLocation(request.businessId, request.branchId);
    if (!locationId) {
      return { available: false, quantityAvailable: 0, quantityOnHand: 0, locationId: null };
    }

    const balance = await prisma.inventoryBalance.findFirst({
      where: { locationId, catalogItemId: request.catalogItemId },
    });

    if (!balance) {
      return { available: false, quantityAvailable: 0, quantityOnHand: 0, locationId };
    }

    const qtyAvailable = Number(balance.quantityAvailable);
    const qtyOnHand = Number(balance.quantityOnHand);

    return {
      available: qtyAvailable >= baseQuantity,
      quantityAvailable: qtyAvailable,
      quantityOnHand: qtyOnHand,
      locationId,
    };
  }

  async reserveStock(params: {
    catalogItemId: string;
    locationId: string;
    quantity: number;
    reference: string;
    referenceType: string;
  }): Promise<StockReservation> {
    const balance = await prisma.inventoryBalance.findFirst({
      where: { locationId: params.locationId, catalogItemId: params.catalogItemId },
    });

    if (!balance) throw new Error("No inventory balance found");

    const qtyAvailable = Number(balance.quantityAvailable);
    if (qtyAvailable < params.quantity) {
      throw new Error(`Insufficient stock: ${qtyAvailable} available, ${params.quantity} requested`);
    }

    await prisma.inventoryBalance.update({
      where: { id: balance.id },
      data: {
        quantityCommitted: { increment: params.quantity },
        quantityAvailable: { decrement: params.quantity },
      },
    });

    return {
      id: balance.id,
      catalogItemId: params.catalogItemId,
      locationId: params.locationId,
      quantity: params.quantity,
      reference: params.reference,
      referenceType: params.referenceType,
    };
  }

  async releaseStock(reservationId: string): Promise<void> {
    const movement = await prisma.stockMovement.findFirst({
      where: { id: reservationId },
    });
    if (!movement) return;

    await prisma.inventoryBalance.update({
      where: { id: movement.locationId },
      data: {
        quantityCommitted: { decrement: Math.abs(Number(movement.quantityChange)) },
        quantityAvailable: { increment: Math.abs(Number(movement.quantityChange)) },
      },
    });
  }

  async commitStock(params: {
    catalogItemId: string;
    locationId: string;
    quantity: number;
    unitId?: string;
    businessId: string;
    reference: string;
    referenceType: string;
  }): Promise<void> {
    let baseQuantity = params.quantity;
    if (params.unitId) {
      const item = await prisma.catalogItem.findUnique({
        where: { id: params.catalogItemId },
        select: { unitId: true },
      });
      if (item?.unitId && params.unitId !== item.unitId) {
        const converted = await uomEngine.convert({
          businessId: params.businessId,
          fromUnitId: params.unitId,
          toUnitId: item.unitId,
          quantity: params.quantity,
        });
        baseQuantity = converted.convertedQuantity;
      }
    }

    const balance = await prisma.inventoryBalance.findFirst({
      where: { locationId: params.locationId, catalogItemId: params.catalogItemId },
    });

    if (!balance) throw new Error("No inventory balance found");

    await prisma.inventoryBalance.update({
      where: { id: balance.id },
      data: {
        quantityOnHand: { decrement: baseQuantity },
        quantityCommitted: { decrement: baseQuantity },
      },
    });

    await prisma.stockMovement.create({
      data: {
        locationId: params.locationId,
        catalogItemId: params.catalogItemId,
        quantityChange: -baseQuantity,
        balanceBefore: Number(balance.quantityOnHand),
        balanceAfter: Number(balance.quantityOnHand) - baseQuantity,
        reference: params.reference,
        referenceType: params.referenceType,
      },
    });
  }

  async receiveStock(params: {
    catalogItemId: string;
    locationId: string;
    quantity: number;
    unitId?: string;
    businessId: string;
    unitCost: number;
    reference: string;
    referenceType: string;
    batchNo?: string;
    expiryDate?: Date;
  }): Promise<void> {
    let baseQuantity = params.quantity;
    if (params.unitId) {
      const item = await prisma.catalogItem.findUnique({
        where: { id: params.catalogItemId },
        select: { unitId: true },
      });
      if (item?.unitId && params.unitId !== item.unitId) {
        const converted = await uomEngine.convert({
          businessId: params.businessId,
          fromUnitId: params.unitId,
          toUnitId: item.unitId,
          quantity: params.quantity,
        });
        baseQuantity = converted.convertedQuantity;
      }
    }

    const balance = await prisma.inventoryBalance.findFirst({
      where: {
        locationId: params.locationId,
        catalogItemId: params.catalogItemId,
        ...(params.batchNo ? { batchNo: params.batchNo } : {}),
      },
    });

    if (balance) {
      const oldQty = Number(balance.quantityOnHand);
      const oldCost = Number(balance.unitCost || 0);
      const newTotalCost = (oldQty * oldCost) + (baseQuantity * params.unitCost);
      const newAvgCost = (oldQty + baseQuantity) > 0 ? newTotalCost / (oldQty + baseQuantity) : params.unitCost;

      await prisma.inventoryBalance.update({
        where: { id: balance.id },
        data: {
          quantityOnHand: { increment: baseQuantity },
          quantityAvailable: { increment: baseQuantity },
          unitCost: newAvgCost,
          ...(params.batchNo ? { batchNo: params.batchNo } : {}),
          ...(params.expiryDate ? { expiryDate: params.expiryDate } : {}),
        },
      });
    } else {
      await prisma.inventoryBalance.create({
        data: {
          locationId: params.locationId,
          catalogItemId: params.catalogItemId,
          quantityOnHand: baseQuantity,
          quantityAvailable: baseQuantity,
          quantityCommitted: 0,
          unitCost: params.unitCost,
          ...(params.batchNo ? { batchNo: params.batchNo } : {}),
          ...(params.expiryDate ? { expiryDate: params.expiryDate } : {}),
        },
      });
    }

    const newBalance = await prisma.inventoryBalance.findFirst({
      where: { locationId: params.locationId, catalogItemId: params.catalogItemId },
    });

    await prisma.stockMovement.create({
      data: {
        locationId: params.locationId,
        catalogItemId: params.catalogItemId,
        quantityChange: baseQuantity,
        balanceBefore: balance ? Number(balance.quantityOnHand) : 0,
        balanceAfter: newBalance ? Number(newBalance.quantityOnHand) : baseQuantity,
        reference: params.reference,
        referenceType: params.referenceType,
      },
    });
  }

  async transferStock(params: {
    fromLocationId: string;
    toLocationId: string;
    catalogItemId: string;
    quantity: number;
    businessId: string;
    reference: string;
  }): Promise<void> {
    const balance = await prisma.inventoryBalance.findFirst({
      where: { locationId: params.fromLocationId, catalogItemId: params.catalogItemId },
    });
    if (!balance || Number(balance.quantityAvailable) < params.quantity) {
      throw new Error("Insufficient stock for transfer");
    }

    await this.commitStock({
      catalogItemId: params.catalogItemId,
      locationId: params.fromLocationId,
      quantity: params.quantity,
      businessId: params.businessId,
      reference: params.reference,
      referenceType: "transfer",
    });

    await this.receiveStock({
      catalogItemId: params.catalogItemId,
      locationId: params.toLocationId,
      quantity: params.quantity,
      businessId: params.businessId,
      unitCost: Number(balance.unitCost || 0),
      reference: params.reference,
      referenceType: "transfer",
    });
  }

  async getInventorySummary(businessId: string): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  }> {
    const items = await prisma.catalogItem.findMany({
      where: { businessId, trackStock: true },
      include: {
        balances: { select: { quantityOnHand: true, unitCost: true, reorderPoint: true } },
      },
    });

    let totalValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    for (const item of items) {
      const totalQty = item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0);
      const value = item.balances.reduce((s, b) => s + Number(b.quantityOnHand) * Number(b.unitCost || 0), 0);
      totalValue += value;

      const minReorder = Math.min(...item.balances.map((b) => Number(b.reorderPoint || 0)));
      if (totalQty <= 0) outOfStockItems++;
      else if (totalQty <= minReorder) lowStockItems++;
    }

    return { totalItems: items.length, totalValue, lowStockItems, outOfStockItems };
  }

  private async resolveDefaultLocation(businessId: string, branchId?: string): Promise<string | null> {
    const location = await prisma.inventoryLocation.findFirst({
      where: {
        businessId,
        ...(branchId ? { branchId } : { type: "business" }),
        isActive: true,
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return location?.id ?? null;
  }
}

export const inventoryEngine = new InventoryEngine();
