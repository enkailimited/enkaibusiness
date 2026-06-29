import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSaleSchema, UpdateSaleSchema, SaleFilterSchema } from "../schemas";
import type { SaleWithRelations, SaleListItem } from "../types";
import { recordCashTransaction } from "@/features/cash-management/services/cash-integration";
import { resolveInventoryLocation } from "@/features/inventory/services/location-resolver";
import { emitSaleCreated, emitSaleUpdated, emitSaleVoided } from "@/modules/ai/events/event-bus";
import { pricingEngine } from "@/server/engines/pricing-engine";
import { taxEngine } from "@/server/engines/tax-engine";

function log(area: string, msg: string, meta?: Record<string, unknown>) {
  console.log(`[DIAG:${area}] ${msg}`, meta ?? "");
}

export async function createSale(
  data: CreateSaleSchema,
  businessId: string,
  workspaceId: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  log("sale.create", "start", { businessId, branchId: data.branchId, itemCount: data.items.length });
  try {
      if (!data.branchId) {
        return { success: false, message: "Branch is required for sales" };
      }

      const isCompleted = data.status === "completed" || !data.status;
    const paymentType = data.paymentType ?? "cash";
    const amountPaid = paymentType === "cash" ? grandTotal : (data.amountPaid ?? 0);
    const isCredit = paymentType === "credit";
    const isPartial = paymentType === "partial";
    const invoiceStatus: string = isCredit ? "unpaid" : isPartial ? "partial" : "paid";
    const paidAmount = isCredit ? 0 : amountPaid;
    const balanceDue = grandTotal - paidAmount;

    const catalogItemIds = [...new Set(data.items.map((i) => i.catalogItemId))];
    const catalogItems = await prisma.catalogItem.findMany({
      where: { id: { in: catalogItemIds } },
      select: { id: true, name: true, price: true, costPrice: true, taxRate: true, trackStock: true, unitId: true, currency: true },
    });
    const catalogMap = new Map(catalogItems.map((ci) => [ci.id, ci]));

    const resolvedItems = await Promise.all(
      data.items.map(async (item) => {
        let unitPrice = item.unitPrice;
        let discount = item.discount ?? 0;
        let taxRate = catalogMap.get(item.catalogItemId)?.taxRate ? Number(catalogMap.get(item.catalogItemId)!.taxRate) : undefined;

        try {
          const priceResult = await pricingEngine.resolvePrice({
            catalogItemId: item.catalogItemId,
            businessId,
            customerId: data.customerId,
            quantity: Number(item.quantity),
            branchId: data.branchId,
          });

          if (priceResult) {
            unitPrice = priceResult.unitPrice;
            if (priceResult.discountPercent) {
              discount = unitPrice * Number(item.quantity) * (priceResult.discountPercent / 100);
            }
            if (priceResult.discount) {
              discount = priceResult.discount;
            }
            if (priceResult.taxRate !== undefined) {
              taxRate = priceResult.taxRate;
            }
          }
        } catch {
          // Engine unavailable — fall through to frontend values
        }

        const subtotal = unitPrice * Number(item.quantity);
        return { ...item, unitPrice, discount, subtotal, taxRate };
      }),
    );

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountTotal = resolvedItems.reduce((sum, item) => sum + (item.discount ?? 0), 0);

    let taxTotal = 0;
    try {
      const taxCalc = await taxEngine.calculate({
        businessId,
        customerId: data.customerId,
        items: resolvedItems.map((item) => ({
          catalogItemId: item.catalogItemId,
          quantity: Number(item.quantity),
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
        subtotal: subtotal - discountTotal,
      });
      taxTotal = taxCalc.totalTax;
    } catch {
      taxTotal = data.taxTotal ?? 0;
    }

    const grandTotal = subtotal - discountTotal + taxTotal;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          workspaceId,
          businessId,
          branchId: data.branchId || null,
          storeId: data.storeId || null,
          customerId: data.customerId || null,
          staffId: data.staffId || null,
          saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
          reference: data.reference || null,
          status: data.status ?? "completed",
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          notes: data.notes || null,
          createdById: createdById || null,
          items: {
            create: resolvedItems.map((item) => {
              const catalogItem = catalogMap.get(item.catalogItemId);
              return {
                catalogItemId: item.catalogItemId,
                variantId: (item as { variantId?: string }).variantId || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount ?? 0,
                subtotal: item.subtotal,
                costPrice: catalogItem?.costPrice ?? null,
              };
            }),
          },
        },
        include: { items: true },
      });

      log("sale.create", "isCompleted", { isCompleted, branchId: data.branchId });
      if (isCompleted) {
        const location = await resolveInventoryLocation(businessId, data.branchId);
        log("sale.create", "resolvedLocation", { locationId: location?.id });

        if (location) {
          for (const item of resolvedItems) {
            const catalogItem = catalogMap.get(item.catalogItemId);
            if (!catalogItem?.trackStock) continue;
            const variantId = (item as { variantId?: string }).variantId ?? null;

            let balance = await tx.inventoryBalance.findFirst({
              where: {
                locationId: location.id,
                catalogItemId: item.catalogItemId,
                variantId,
              },
            });

            if (!balance) {
              balance = await tx.inventoryBalance.create({
                data: {
                  locationId: location.id,
                  catalogItemId: item.catalogItemId,
                  variantId,
                  quantityOnHand: 0,
                  quantityAvailable: 0,
                  quantityCommitted: 0,
                },
              });
            }

            const currentQty = Number(balance.quantityOnHand);
            if (currentQty < item.quantity) {
              throw new Error(`Insufficient stock for "${catalogItem.name || item.catalogItemId}". Available: ${currentQty}, requested: ${item.quantity}`);
            }
            const newQty = currentQty - item.quantity;

            await tx.inventoryBalance.update({
              where: { id: balance.id },
              data: { quantityOnHand: newQty, quantityAvailable: newQty },
            });

            await tx.stockMovement.create({
              data: {
                locationId: location.id,
                catalogItemId: item.catalogItemId,
                variantId,
                quantityChange: -item.quantity,
                balanceBefore: currentQty,
                balanceAfter: newQty,
                referenceType: "sale",
                reference: created.id,
                notes: `Sale ${created.reference || created.id}`,
                createdById: createdById || null,
              },
            });
          }
        }

        let effectiveCustomerId = data.customerId;
        if (!effectiveCustomerId) {
          const walkIn = await tx.customer.findFirst({
            where: { businessId, email: "walkin@internal" },
            select: { id: true },
          });
          if (walkIn) {
            effectiveCustomerId = walkIn.id;
          } else {
            const c = await tx.customer.create({
              data: {
                workspaceId,
                businessId,
                name: "Walk-In Customer",
                email: "walkin@internal",
                phone: "",
                isActive: true,
              },
              select: { id: true },
            });
            effectiveCustomerId = c.id;
          }
        }

        const invoiceNumber = `INV-${businessId.substring(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const invoice = await tx.invoice.create({
          data: {
            workspaceId,
            businessId,
            branchId: data.branchId || null,
            customerId: effectiveCustomerId,
            saleId: created.id,
            invoiceNumber,
            status: invoiceStatus,
            subtotal,
            tax: taxTotal,
            total: grandTotal,
            paidAmount,
            balanceDue,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            notes: data.customerId ? (data.notes || null) : `Walk-in sale — ${data.notes || ""}`.trim(),
            items: {
              create: resolvedItems.map((item) => ({
                catalogItemId: item.catalogItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
            },
          },
        });

        if (!isCredit && paidAmount > 0) {
          const paymentMethod = await tx.paymentMethod.findFirst({
            where: { businessId, isActive: true },
            orderBy: { createdAt: "asc" },
          });

          if (!paymentMethod) {
            await tx.paymentMethod.create({
              data: {
                businessId,
                name: "Cash",
                type: "cash",
                isActive: true,
              },
            });
          }

          const pm = paymentMethod ?? await tx.paymentMethod.findFirst({
            where: { businessId, isActive: true },
          });

          if (pm) {
            await tx.payment.create({
              data: {
                businessId,
                workspaceId,
                branchId: data.branchId || null,
                storeId: data.storeId || null,
                paymentMethodId: pm.id,
                customerId: effectiveCustomerId,
                amount: paidAmount,
                status: "completed",
                saleId: created.id,
                invoiceId: invoice.id,
                paidAt: new Date(),
                notes: `Payment for sale ${created.reference || created.id}`,
                createdById: createdById || null,
              },
            });
          }

          if (paymentType === "cash" && paidAmount > 0) {
            await recordCashTransaction(
              tx,
              businessId,
              data.branchId || null,
              "cash_in",
              paidAmount,
              created.reference || created.id,
              `Cash payment for sale ${created.reference || created.id}`,
            );
          }
        }
      }

      return created;
    });

    emitSaleCreated(businessId, createdById ?? "", sale.id, {
      reference: sale.reference ?? sale.id,
      grandTotal: grandTotal,
      paymentType: paymentType,
    });

    return {
      success: true,
      message: "Sale created successfully",
      data: { id: sale.id },
    };
  } catch (error) {
    console.error("Create sale error:", error);
    return { success: false, message: "Failed to create sale" };
  }
}

export async function getSale(id: string): Promise<SaleWithRelations | null> {
  const raw = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          catalogItem: {
            select: { id: true, name: true, sku: true, price: true },
          },
        },
      },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      staff: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { invoices: true, returns: true } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    saleDate: raw.saleDate.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    subtotal: Number(raw.subtotal),
    discountTotal: Number(raw.discountTotal),
    taxTotal: Number(raw.taxTotal),
    grandTotal: Number(raw.grandTotal),
    profitMargin: raw.profitMargin ? Number(raw.profitMargin) : null,
    items: raw.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      subtotal: Number(i.subtotal),
      costPrice: i.costPrice ? Number(i.costPrice) : null,
    })),
  } as unknown as SaleWithRelations;
}

export async function getBusinessSales(
  businessId: string,
  filter?: SaleFilterSchema,
): Promise<SaleListItem[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.branchId) where.branchId = filter.branchId;
  if (filter?.storeId) where.storeId = filter.storeId;
  if (filter?.customerId) where.customerId = filter.customerId;
  if (filter?.staffId) where.staffId = filter.staffId;
  if (filter?.status) where.status = filter.status;

  if (filter?.dateFrom || filter?.dateTo) {
    where.saleDate = {};
    if (filter.dateFrom) where.saleDate.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.saleDate.lte = new Date(filter.dateTo);
  }

  if (filter?.search) {
    where.OR = [
      { reference: { contains: filter.search, mode: "insensitive" } },
      { notes: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const take = filter?.limit ?? 20;
  const skip = ((filter?.page ?? 1) - 1) * take;

  const raw = await prisma.sale.findMany({
    where,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { saleDate: "desc" },
    skip,
    take,
  });

  return raw.map((s) => ({
    ...s,
    saleDate: s.saleDate.toISOString(),
    grandTotal: Number(s.grandTotal),
  })) as unknown as SaleListItem[];
}

export async function updateSale(
  id: string,
  data: UpdateSaleSchema,
  businessId?: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    let resolvedItems: Array<Record<string, unknown>> | undefined;

    if (data.items && data.items.length > 0) {
      const catalogItemIds = [...new Set(data.items.map((i) => i.catalogItemId))];
      const catalogItems = await prisma.catalogItem.findMany({
        where: { id: { in: catalogItemIds } },
        select: { id: true, price: true, costPrice: true, taxRate: true, trackStock: true },
      });
      const catalogMap = new Map(catalogItems.map((ci) => [ci.id, ci]));

      resolvedItems = await Promise.all(
        data.items.map(async (item) => {
          let unitPrice = item.unitPrice;
          let discount = item.discount ?? 0;
          let taxRate = catalogMap.get(item.catalogItemId)?.taxRate
            ? Number(catalogMap.get(item.catalogItemId)!.taxRate)
            : undefined;

          try {
            const priceResult = await pricingEngine.resolvePrice({
              catalogItemId: item.catalogItemId,
              businessId: businessId!,
              customerId: data.customerId,
              quantity: Number(item.quantity),
              branchId: data.branchId,
            });

            if (priceResult) {
              unitPrice = priceResult.unitPrice;
              if (priceResult.discountPercent) {
                discount = unitPrice * Number(item.quantity) * (priceResult.discountPercent / 100);
              }
              if (priceResult.discount) {
                discount = priceResult.discount;
              }
              if (priceResult.taxRate !== undefined) {
                taxRate = priceResult.taxRate;
              }
            }
          } catch {
            // fall through
          }

          const subtotal = unitPrice * Number(item.quantity);
          return { ...item, unitPrice, discount, subtotal, taxRate };
        }),
      );
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findUnique({
        where: { id },
        select: { grandTotal: true, status: true, branchId: true, businessId: true },
      });
      if (!existing) throw new Error("Sale not found");

      const isCompleted = existing.status === "completed";

      if (data.items) {
        const oldItems = await tx.saleItem.findMany({ where: { saleId: id } });

        if (isCompleted && oldItems.length > 0) {
          const location = await resolveInventoryLocation(existing.businessId, existing.branchId);
          if (location) {
            for (const oldItem of oldItems) {
              const catalogItem = await tx.catalogItem.findUnique({
                where: { id: oldItem.catalogItemId },
                select: { trackStock: true },
              });
              if (!catalogItem?.trackStock) continue;

              let balance = await tx.inventoryBalance.findFirst({
                where: {
                  locationId: location.id,
                  catalogItemId: oldItem.catalogItemId,
                  variantId: oldItem.variantId ?? null,
                },
              });

              if (balance) {
                const currentQty = Number(balance.quantityOnHand);
                const newQty = currentQty + Number(oldItem.quantity);
                await tx.inventoryBalance.update({
                  where: { id: balance.id },
                  data: { quantityOnHand: newQty, quantityAvailable: newQty },
                });
                await tx.stockMovement.create({
                  data: {
                    locationId: location.id,
                    catalogItemId: oldItem.catalogItemId,
                    variantId: oldItem.variantId || null,
                    quantityChange: Number(oldItem.quantity),
                    balanceBefore: currentQty,
                    balanceAfter: newQty,
                    referenceType: "sale",
                    reference: id,
                    notes: `Restore: sale update reversal ${id}`,
                    createdById: createdById || null,
                  },
                });
              }
            }
          }
        }

        await tx.saleItem.deleteMany({ where: { saleId: id } });
      }

      const items: Array<Record<string, unknown>> = resolvedItems ?? (data.items ?? []) as unknown as Array<Record<string, unknown>>;
      const hasItems = items.length > 0;

      let subtotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;
      let grandTotal = Number(existing.grandTotal);

      if (hasItems) {
        if (resolvedItems) {
          subtotal = (resolvedItems as Array<Record<string, unknown>>).reduce((s, i) => s + Number(i.subtotal), 0);
          discountTotal = (resolvedItems as Array<Record<string, unknown>>).reduce((s, i) => s + Number(i.discount ?? 0), 0);

          try {
            const taxCalc = await taxEngine.calculate({
              businessId: existing.businessId,
              customerId: data.customerId,
              items: (resolvedItems as Array<Record<string, unknown>>).map((i) => ({
                catalogItemId: i.catalogItemId as string,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                taxRate: i.taxRate as number | undefined,
              })),
              subtotal: subtotal - discountTotal,
            });
            taxTotal = taxCalc.totalTax;
          } catch {
            taxTotal = data.taxTotal ?? 0;
          }
        } else {
          subtotal = (data.items ?? []).reduce((s, item) => s + item.subtotal, 0);
          discountTotal = data.discountTotal ?? 0;
          taxTotal = data.taxTotal ?? 0;
        }
        grandTotal = subtotal - discountTotal + taxTotal;
      }

      await tx.sale.update({
        where: { id },
        data: {
          branchId: data.branchId !== undefined ? (data.branchId || null) : undefined,
          storeId: data.storeId !== undefined ? (data.storeId || null) : undefined,
          customerId: data.customerId !== undefined ? (data.customerId || null) : undefined,
          staffId: data.staffId !== undefined ? (data.staffId || null) : undefined,
          saleDate: data.saleDate ? new Date(data.saleDate) : undefined,
          reference: data.reference !== undefined ? (data.reference || null) : undefined,
          status: data.status,
          subtotal: hasItems ? subtotal : undefined,
          discountTotal: hasItems ? discountTotal : 0,
          taxTotal: hasItems ? taxTotal : 0,
          grandTotal: hasItems ? grandTotal : undefined,
          notes: data.notes !== undefined ? (data.notes || null) : undefined,
          items: data.items
            ? {
                create: (resolvedItems ?? data.items).map((item: Record<string, unknown>) => ({
                  catalogItemId: item.catalogItemId as string,
                  variantId: (item.variantId as string) || null,
                  quantity: item.quantity as number,
                  unitPrice: item.unitPrice as number,
                  discount: (item.discount as number) ?? 0,
                  subtotal: item.subtotal as number,
                })),
              }
            : undefined,
        },
      });

      if (isCompleted && data.items) {
        const location = await resolveInventoryLocation(existing.businessId, existing.branchId);
        if (location) {
          const forDeduction = resolvedItems ?? data.items;
          for (const item of forDeduction) {
            const itemRecord = item as Record<string, unknown>;
            const catalogItem = await tx.catalogItem.findUnique({
              where: { id: itemRecord.catalogItemId as string },
              select: { name: true, trackStock: true },
            });
            if (!catalogItem?.trackStock) continue;
            const variantId = (itemRecord.variantId as string) ?? null;

            let balance = await tx.inventoryBalance.findFirst({
              where: {
                locationId: location.id,
                catalogItemId: itemRecord.catalogItemId as string,
                variantId,
              },
            });

            if (!balance) {
              balance = await tx.inventoryBalance.create({
                data: {
                  locationId: location.id,
                  catalogItemId: itemRecord.catalogItemId as string,
                  variantId,
                  quantityOnHand: 0,
                  quantityAvailable: 0,
                  quantityCommitted: 0,
                },
              });
            }

            const qty = Number(itemRecord.quantity);
            const currentQty = Number(balance.quantityOnHand);
            if (currentQty < qty) {
              throw new Error(`Insufficient stock for "${catalogItem.name || itemRecord.catalogItemId}". Available: ${currentQty}, requested: ${qty}`);
            }
            const newQty = currentQty - qty;

            await tx.inventoryBalance.update({
              where: { id: balance.id },
              data: { quantityOnHand: newQty, quantityAvailable: newQty },
            });

            await tx.stockMovement.create({
              data: {
                locationId: location.id,
                catalogItemId: itemRecord.catalogItemId as string,
                variantId,
                quantityChange: -qty,
                balanceBefore: currentQty,
                balanceAfter: newQty,
                referenceType: "sale",
                reference: id,
                notes: `Sale update deduction ${id}`,
                createdById: createdById || null,
              },
            });
          }
        }
      }

      const linkedInvoice = await tx.invoice.findFirst({
        where: { saleId: id },
        select: { id: true, paidAmount: true, total: true, balanceDue: true },
      });

      if (linkedInvoice && hasItems) {
        const invoicePaidAmount = Number(linkedInvoice.paidAmount);
        const newBalanceDue = Math.max(0, grandTotal - invoicePaidAmount);

        await tx.invoice.update({
          where: { id: linkedInvoice.id },
          data: {
            subtotal,
            tax: taxTotal,
            total: grandTotal,
            balanceDue: newBalanceDue,
          },
        });
      }
    });

    if (businessId && createdById) {
      emitSaleUpdated(businessId, createdById, id, {
        status: data.status ?? "completed",
      });
    }

    return { success: true, message: "Sale updated successfully", data: { id } };
  } catch (error) {
    console.error("Update sale error:", error);
    return { success: false, message: "Failed to update sale" };
  }
}

export async function voidSale(
  id: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) return { success: false, message: "Sale not found" };
    if (existing.status === "cancelled" || existing.status === "refunded") {
      return { success: false, message: "Sale is already voided" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id },
        data: { status: "refunded" },
      });

      const location = await resolveInventoryLocation(existing.businessId, existing.branchId);

      if (location) {
        for (const item of existing.items) {
          const catalogItem = await tx.catalogItem.findUnique({
            where: { id: item.catalogItemId },
            select: { trackStock: true },
          });
          if (!catalogItem?.trackStock) continue;

          let balance = await tx.inventoryBalance.findFirst({
            where: {
              locationId: location.id,
              catalogItemId: item.catalogItemId,
              variantId: item.variantId ?? null,
            },
          });

          if (balance) {
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
                referenceType: "sale",
                reference: id,
                notes: `Reversal: voided sale ${existing.reference || id}`,
              },
            });
          }
        }
      }

      const invoice = await tx.invoice.findFirst({
        where: { saleId: id },
        select: { id: true, status: true },
      });

      if (invoice && invoice.status !== "refunded") {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "refunded", balanceDue: 0 },
        });
      }

      const payments = await tx.payment.findMany({
        where: { saleId: id, status: "completed" },
        include: { paymentMethod: { select: { type: true } } },
      });

      for (const payment of payments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "refunded" },
        });

        if (payment.paymentMethod?.type === "cash") {
          await recordCashTransaction(
            tx,
            existing.businessId,
            existing.branchId,
            "cash_out",
            Number(payment.amount),
            existing.reference || id,
            `Reversal: voided sale ${existing.reference || id}`,
          );
        }

        if (invoice) {
          const inv = await tx.invoice.findUnique({ where: { id: invoice.id }, select: { paidAmount: true, total: true } });
          if (inv) {
            const newPaid = Math.max(0, Number(inv.paidAmount) - Number(payment.amount));
            const newBalance = Number(inv.total) - newPaid;
            const newStatus = newPaid <= 0 ? "unpaid" : "partial";
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { paidAmount: newPaid, balanceDue: newBalance, status: newStatus },
            });
          }
        }
      }
    });

    if (userId) {
      const { createAuditLog } = await import("@/server/services/audit-service");
      await createAuditLog(userId, "VOID", "sale", id, {
        before: { status: existing.status },
        after: { status: "refunded" },
      });
    }

    emitSaleVoided(existing.businessId, userId ?? "", id, {
      reference: existing.reference ?? id,
      grandTotal: Number(existing.grandTotal),
    });

    return { success: true, message: "Sale refunded successfully" };
  } catch (error) {
    console.error("Void sale error:", error);
    return { success: false, message: "Failed to refund sale" };
  }
}

export async function deleteSale(
  id: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.sale.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) return { success: false, message: "Sale not found" };

    if (existing.status !== "draft") {
      return {
        success: false,
        message: "Cannot delete a completed or cancelled sale. Void it instead to preserve historical data.",
      };
    }

    await prisma.sale.delete({ where: { id } });

    if (userId) {
      const { createAuditLog } = await import("@/server/services/audit-service");
      await createAuditLog(userId, "DELETE", "sale", id);
    }

    return { success: true, message: "Sale deleted successfully" };
  } catch (error) {
    console.error("Delete sale error:", error);
    return { success: false, message: "Failed to delete sale" };
  }
}
