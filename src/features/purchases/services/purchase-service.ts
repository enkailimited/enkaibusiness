import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePurchaseSchema, UpdatePurchaseSchema, PurchaseFilterSchema } from "../schemas";
import type { PurchaseWithItems, PurchaseWithRelations, PurchaseListItem, PurchaseStatus } from "../types";
import { computePurchaseStatus, validatePurchaseBalance } from "../types";
import { isAdvancedProcurement } from "@/features/procurement/services/procurement-service";
import { resolveInventoryLocation } from "@/features/inventory/services/location-resolver";
import { emitPurchaseCreated } from "@/modules/ai/events/event-bus";

async function getBranchRequirement(businessId: string): Promise<boolean> {
  try {
    const { getSetting } = await import("@/features/settings/services/setting-service");
    const setting = await getSetting("business.isBusinessWide", { businessId });
    return setting?.value !== true;
  } catch {
    return true;
  }
}

function log(area: string, msg: string, meta?: Record<string, unknown>) {
  console.log(`[DIAG:${area}] ${msg}`, meta ?? "");
}

export async function createPurchase(
  data: CreatePurchaseSchema,
  businessId: string,
  workspaceId: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  log("purchase.create", "start", { businessId, branchId: data.branchId, itemCount: data.items.length });
  try {
    const branchRequired = await getBranchRequirement(businessId);
    if (branchRequired && !data.branchId) {
      return { success: false, message: "Branch is required for purchases" };
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = data.tax ?? 0;
    const total = subtotal + tax;
    const paidAmount = data.paidAmount ?? 0;
    const balanceDue = total - paidAmount;
    const status = computePurchaseStatus(total, paidAmount, data.dueDate ?? null);

    const catalogItemIds = [...new Set(data.items.map((i) => i.catalogItemId))];
    const catalogItems = await prisma.catalogItem.findMany({
      where: { id: { in: catalogItemIds } },
      select: { id: true, name: true, costPrice: true, trackStock: true },
    });
    const catalogMap = new Map(catalogItems.map((ci) => [ci.id, ci]));

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          workspaceId,
          businessId,
          branchId: data.branchId || null,
          storeId: data.storeId || null,
          supplierId: data.supplierId,
          staffId: data.staffId || null,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
          reference: data.reference || null,
          status,
          paidAmount,
          balanceDue,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          subtotal,
          tax,
          total,
          notes: data.notes || null,
          createdById: createdById || null,
          items: {
            create: data.items.map((item) => ({
              catalogItemId: item.catalogItemId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      if (createdById) {
        const { createAuditLog } = await import("@/server/services/audit-service");
        await createAuditLog(createdById, "CREATE", "purchase", created.id, {
          after: { status, total, paidAmount, balanceDue },
        });
      }

      const advanced = await isAdvancedProcurement(businessId);
      log("purchase.create", "isAdvancedProcurement", { businessId, advanced });
      if (!advanced) {
        const location = await resolveInventoryLocation(businessId, data.branchId);
        log("purchase.create", "resolvedLocation", { locationId: location?.id });

        if (location) {
          for (const item of data.items) {
            const catalogItem = catalogMap.get(item.catalogItemId);
            if (!catalogItem?.trackStock) continue;

            let balance = await tx.inventoryBalance.findFirst({
              where: {
                locationId: location.id,
                catalogItemId: item.catalogItemId,
                variantId: item.variantId ?? null,
              },
            });

            if (!balance) {
              balance = await tx.inventoryBalance.create({
                data: {
                  locationId: location.id,
                  catalogItemId: item.catalogItemId,
                  variantId: item.variantId || null,
                  quantityOnHand: 0,
                  quantityAvailable: 0,
                  quantityCommitted: 0,
                },
              });
            }

            const currentQty = Number(balance.quantityOnHand);
            const newQty = currentQty + Number(item.quantity);

            await tx.inventoryBalance.update({
              where: { id: balance.id },
              data: { quantityOnHand: newQty, quantityAvailable: newQty },
            });

            await tx.stockMovement.create({
              data: {
                locationId: location.id,
                catalogItemId: item.catalogItemId,
                variantId: item.variantId || null,
                quantityChange: Number(item.quantity),
                balanceBefore: currentQty,
                balanceAfter: newQty,
                referenceType: "purchase",
                reference: created.id,
                notes: `Purchase ${created.reference || created.id}`,
                createdById: createdById || null,
              },
            });

            const unitCost = Number(item.unitCost);
            if (unitCost > 0 && catalogItem.costPrice) {
              const currentCost = Number(catalogItem.costPrice);
              const existingQty = currentQty;
              const totalCost = (currentCost * existingQty) + (unitCost * Number(item.quantity));
              const newAvgCost = totalCost / (existingQty + Number(item.quantity));
              await tx.catalogItem.update({
                where: { id: item.catalogItemId },
                data: { costPrice: Math.round(newAvgCost * 100) / 100 },
              });
            } else if (unitCost > 0) {
              await tx.catalogItem.update({
                where: { id: item.catalogItemId },
                data: { costPrice: unitCost },
              });
            }
          }
        }
      }

      return created;
    });

    emitPurchaseCreated(businessId, createdById ?? "", purchase.id, {
      reference: purchase.reference ?? purchase.id,
      total: total,
      supplierId: data.supplierId,
    });

    return {
      success: true,
      message: "Purchase created successfully",
      data: { id: purchase.id },
    };
  } catch (error) {
    console.error("Create purchase error:", error);
    return { success: false, message: "Failed to create purchase" };
  }
}

export async function updatePurchase(
  id: string,
  data: UpdatePurchaseSchema,
  userId?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.purchase.findUnique({
        where: { id },
        select: { paidAmount: true, total: true, status: true, dueDate: true },
      });
      if (!existing) throw new Error("Purchase not found");

      if (existing.status === "cancelled") {
        throw new Error("Cannot update a cancelled purchase");
      }

      if (data.items) {
        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      }

      const items = data.items ?? [];
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = data.tax ?? 0;
      const total = items.length > 0 ? subtotal + tax : Number(existing.total);
      const existingPaid = Number(existing.paidAmount);
      const paidAmount = data.paidAmount ?? existingPaid;
      const newBalanceDue = items.length > 0 ? Math.max(0, total - paidAmount) : Math.max(0, Number(existing.total) - paidAmount);
      const dueDate = data.dueDate !== undefined ? data.dueDate : (existing.dueDate ? existing.dueDate.toISOString() : null);
      const status = data.status ?? computePurchaseStatus(total, paidAmount, dueDate);

      if (!validatePurchaseBalance(total, paidAmount, newBalanceDue)) {
        throw new Error("Purchase balance invariant failed: paidAmount + balanceDue must equal total");
      }

      await tx.purchase.update({
        where: { id },
        data: {
          branchId: data.branchId !== undefined ? (data.branchId || null) : undefined,
          storeId: data.storeId !== undefined ? (data.storeId || null) : undefined,
          supplierId: data.supplierId,
          staffId: data.staffId !== undefined ? (data.staffId || null) : undefined,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
          reference: data.reference !== undefined ? (data.reference || null) : undefined,
          status,
          paidAmount,
          subtotal: items.length > 0 ? subtotal : undefined,
          tax,
          total: items.length > 0 ? total : undefined,
          balanceDue: newBalanceDue,
          notes: data.notes !== undefined ? (data.notes || null) : undefined,
          items: data.items
            ? {
                create: data.items.map((item) => ({
                  catalogItemId: item.catalogItemId,
                  variantId: item.variantId || null,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                  subtotal: item.subtotal,
                })),
              }
            : undefined,
        },
      });

      if (userId) {
        const { createAuditLog } = await import("@/server/services/audit-service");
        await createAuditLog(userId, "UPDATE", "purchase", id, {
          before: { status: existing.status, total: Number(existing.total), paidAmount: Number(existing.paidAmount) },
          after: { status, total, paidAmount, balanceDue: newBalanceDue },
        });
      }
    });

    return {
      success: true,
      message: "Purchase updated successfully",
      data: { id },
    };
  } catch (error) {
    console.error("Update purchase error:", error);
    return { success: false, message: "Failed to update purchase" };
  }
}

export async function getPurchase(id: string): Promise<PurchaseWithRelations | null> {
  const raw = await prisma.purchase.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          catalogItem: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
      supplier: { select: { id: true, name: true } },
      staff: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    purchaseDate: raw.purchaseDate.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    subtotal: Number(raw.subtotal),
    tax: Number(raw.tax),
    total: Number(raw.total),
    paidAmount: Number(raw.paidAmount),
    balanceDue: Number(raw.balanceDue),
    dueDate: raw.dueDate?.toISOString() ?? null,
    items: raw.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
      subtotal: Number(i.subtotal),
    })),
  } as unknown as PurchaseWithRelations;
}

export async function getBusinessPurchases(
  businessId: string,
  filter?: PurchaseFilterSchema,
): Promise<PurchaseListItem[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.branchId) {
    where.branchId = filter.branchId;
  }

  if (filter?.supplierId) {
    where.supplierId = filter.supplierId;
  }

  if (filter?.status) {
    where.status = filter.status;
  }

  if (filter?.dateFrom || filter?.dateTo) {
    where.purchaseDate = {};
    if (filter.dateFrom) where.purchaseDate.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.purchaseDate.lte = new Date(filter.dateTo);
  }

  if (filter?.search) {
    where.OR = [
      { reference: { contains: filter.search, mode: "insensitive" } },
      { supplier: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const take = filter?.limit ?? 20;
  const skip = ((filter?.page ?? 1) - 1) * take;

  const raw = await prisma.purchase.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { purchaseDate: "desc" },
    skip,
    take,
  });

  return raw.map((p) => ({
    ...p,
    purchaseDate: p.purchaseDate.toISOString(),
    subtotal: Number(p.subtotal),
    tax: Number(p.tax),
    total: Number(p.total),
    paidAmount: Number(p.paidAmount),
    balanceDue: Number(p.balanceDue),
  })) as unknown as PurchaseListItem[];
}

export async function cancelPurchase(
  id: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) return { success: false, message: "Purchase not found" };
    if (existing.status === "cancelled") {
      return { success: false, message: "Purchase is already cancelled" };
    }

    log("purchase.cancel", "cancelling", { id, branchId: existing.branchId, status: existing.status });
    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id },
        data: { status: "cancelled" },
      });

      const advanced = await isAdvancedProcurement(existing.businessId);
      if (!advanced) {
        const location = await resolveInventoryLocation(existing.businessId, existing.branchId);

        log("purchase.cancel", "reversing stock", { locationId: location.id, itemCount: existing.items.length });
        if (location) {
          for (const item of existing.items) {
            const catalogItem = await tx.catalogItem.findUnique({
              where: { id: item.catalogItemId },
              select: { trackStock: true },
            });
            if (!catalogItem?.trackStock) {
              log("purchase.cancel", "skip non-tracked", { catalogItemId: item.catalogItemId });
              continue;
            }

            const balance = await tx.inventoryBalance.findFirst({
              where: {
                locationId: location.id,
                catalogItemId: item.catalogItemId,
                variantId: item.variantId ?? null,
              },
            });

            if (balance) {
              const currentQty = Number(balance.quantityOnHand);
              const returnQty = Math.min(Number(item.quantity), currentQty);
              const newQty = currentQty - returnQty;

              await tx.inventoryBalance.update({
                where: { id: balance.id },
                data: { quantityOnHand: newQty, quantityAvailable: newQty },
              });

              await tx.stockMovement.create({
                data: {
                  locationId: location.id,
                  catalogItemId: item.catalogItemId,
                  variantId: item.variantId || null,
                  quantityChange: -returnQty,
                  balanceBefore: currentQty,
                  balanceAfter: newQty,
                  referenceType: "purchase",
                  reference: id,
                  notes: `Reversal: cancelled purchase ${existing.reference || id}`,
                  createdById: userId || null,
                },
              });
            }
          }
        }
      }

      const payments = await tx.payment.findMany({
        where: { purchaseId: id, status: "completed" },
      });

      for (const payment of payments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "voided" },
        });
      }
    });

    if (userId) {
      const { createAuditLog } = await import("@/server/services/audit-service");
      await createAuditLog(userId, "CANCEL", "purchase", id, {
        before: { status: existing.status },
        after: { status: "cancelled" },
      });
    }

    return { success: true, message: "Purchase cancelled successfully" };
  } catch (error) {
    console.error("Cancel purchase error:", error);
    return { success: false, message: "Failed to cancel purchase" };
  }
}

export async function deletePurchase(
  id: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.purchase.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) return { success: false, message: "Purchase not found" };

    if (existing.status !== "draft") {
      return {
        success: false,
        message: "Cannot delete a completed or cancelled purchase. Cancel it instead.",
      };
    }

    await prisma.purchase.delete({ where: { id } });

    if (userId) {
      const { createAuditLog } = await import("@/server/services/audit-service");
      await createAuditLog(userId, "DELETE", "purchase", id);
    }

    return { success: true, message: "Purchase deleted successfully" };
  } catch (error) {
    console.error("Delete purchase error:", error);
    return { success: false, message: "Failed to delete purchase" };
  }
}
