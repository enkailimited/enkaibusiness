import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export interface DeliveryItemInput {
  catalogItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateDeliveryInput {
  workspaceId: string;
  businessId: string;
  branchId?: string;
  customerId?: string;
  saleId?: string;
  invoiceId?: string;
  deliveryDate?: Date;
  estimatedArrival?: Date;
  notes?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  items: DeliveryItemInput[];
}

export interface UpdateDeliveryInput {
  deliveryDate?: Date;
  estimatedArrival?: Date;
  notes?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  items?: DeliveryItemInput[];
}

export interface PODInput {
  signatureUrl?: string;
  receivedById: string;
  photoUrls?: string[];
  notes?: string;
}

type DeliveryWithItems = Record<string, unknown>;

function serialize(raw: Record<string, unknown>): DeliveryWithItems {
  return raw as unknown as DeliveryWithItems;
}

export async function createDelivery(
  input: CreateDeliveryInput,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { items, ...rest } = input;

    const reference = `DN-${Date.now().toString(36).toUpperCase()}`;

    const delivery = await prisma.deliveryNote.create({
      data: {
        ...rest,
        reference,
        status: "draft",
        createdById: createdById || null,
        items: {
          create: items.map((item) => ({
            catalogItemId: item.catalogItemId,
            quantity: item.quantity,
            deliveredQuantity: 0,
            notes: item.notes || null,
          })),
        },
      },
      include: { items: { include: { catalogItem: { select: { id: true, name: true, sku: true } } } } },
    });

    return {
      success: true,
      message: "Delivery note created",
      data: { id: delivery.id },
    };
  } catch (error) {
    console.error("Create delivery error:", error);
    return { success: false, message: "Failed to create delivery note" };
  }
}

export async function updateDelivery(
  id: string,
  input: UpdateDeliveryInput,
): Promise<ActionResponse> {
  try {
    const { items, ...rest } = input;

    if (items) {
      await prisma.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } });
      await prisma.deliveryNoteItem.createMany({
        data: items.map((item) => ({
          deliveryNoteId: id,
          catalogItemId: item.catalogItemId,
          quantity: item.quantity,
          deliveredQuantity: 0,
          notes: item.notes || null,
        })),
      });
    }

    await prisma.deliveryNote.update({
      where: { id },
      data: { ...rest, updatedAt: new Date() },
    });

    return { success: true, message: "Delivery note updated" };
  } catch (error) {
    console.error("Update delivery error:", error);
    return { success: false, message: "Failed to update delivery note" };
  }
}

export async function getDelivery(id: string): Promise<DeliveryWithItems | null> {
  const delivery = await prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      items: { include: { catalogItem: { select: { id: true, name: true, sku: true, unitId: true } } } },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      sale: { select: { id: true, reference: true, grandTotal: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      receivedBy: { select: { id: true, name: true } },
    },
  });

  return delivery ? serialize(delivery as unknown as Record<string, unknown>) : null;
}

export async function listDeliveries(
  businessId: string,
  filter?: {
    status?: string;
    customerId?: string;
    saleId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    branchId?: string;
  },
): Promise<DeliveryWithItems[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.status) where.status = filter.status;
  if (filter?.customerId) where.customerId = filter.customerId;
  if (filter?.saleId) where.saleId = filter.saleId;
  if (filter?.branchId) where.branchId = filter.branchId;
  if (filter?.dateFrom || filter?.dateTo) {
    where.deliveryDate = {};
    if (filter.dateFrom) (where.deliveryDate as Record<string, unknown>).gte = filter.dateFrom;
    if (filter.dateTo) (where.deliveryDate as Record<string, unknown>).lte = filter.dateTo;
  }

  const deliveries = await prisma.deliveryNote.findMany({
    where: where as Parameters<typeof prisma.deliveryNote.findMany>[0]["where"],
    include: {
      items: true,
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return deliveries.map((d) => serialize(d as unknown as Record<string, unknown>));
}

export async function updateDeliveryStatus(
  id: string,
  status: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    const validTransitions: Record<string, string[]> = {
      draft: ["preparing", "cancelled"],
      preparing: ["dispatched", "cancelled"],
      dispatched: ["in-transit", "cancelled"],
      "in-transit": ["delivered", "partially-delivered", "cancelled"],
      "partially-delivered": ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    const delivery = await prisma.deliveryNote.findUnique({ where: { id } });
    if (!delivery) return { success: false, message: "Delivery note not found" };

    const allowed = validTransitions[delivery.status];
    if (!allowed || !allowed.includes(status)) {
      return {
        success: false,
        message: `Cannot transition from "${delivery.status}" to "${status}"`,
      };
    }

    await prisma.deliveryNote.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    return { success: true, message: `Delivery status updated to "${status}"` };
  } catch (error) {
    console.error("Update delivery status error:", error);
    return { success: false, message: "Failed to update delivery status" };
  }
}

export async function recordPOD(
  id: string,
  pod: PODInput,
): Promise<ActionResponse> {
  try {
    const delivery = await prisma.deliveryNote.findUnique({ where: { id } });
    if (!delivery) return { success: false, message: "Delivery note not found" };
    if (delivery.status === "cancelled") return { success: false, message: "Cannot POD a cancelled delivery" };

    const items = await prisma.deliveryNoteItem.findMany({ where: { deliveryNoteId: id } });
    const allDelivered = items.every((item) => Number(item.deliveredQuantity) >= Number(item.quantity));

    await prisma.deliveryNote.update({
      where: { id },
      data: {
        status: allDelivered ? "delivered" : "partially-delivered",
        signatureUrl: pod.signatureUrl || null,
        receivedById: pod.receivedById,
        receivedAt: new Date(),
        photoUrls: pod.photoUrls || [],
        notes: pod.notes ? `${delivery.notes || ""}\nPOD: ${pod.notes}`.trim() : delivery.notes,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: "Proof of delivery recorded" };
  } catch (error) {
    console.error("Record POD error:", error);
    return { success: false, message: "Failed to record proof of delivery" };
  }
}

export async function recordPartialDelivery(
  id: string,
  items: Array<{ catalogItemId: string; deliveredQuantity: number }>,
): Promise<ActionResponse> {
  try {
    for (const item of items) {
      await prisma.deliveryNoteItem.updateMany({
        where: { deliveryNoteId: id, catalogItemId: item.catalogItemId },
        data: { deliveredQuantity: item.deliveredQuantity },
      });
    }

    const allItems = await prisma.deliveryNoteItem.findMany({ where: { deliveryNoteId: id } });
    const allDelivered = allItems.every((i) => Number(i.deliveredQuantity) >= Number(i.quantity));
    const anyDelivered = allItems.some((i) => Number(i.deliveredQuantity) > 0);

    let status = "in-transit";
    if (allDelivered) status = "delivered";
    else if (anyDelivered) status = "partially-delivered";

    await prisma.deliveryNote.update({ where: { id }, data: { status, updatedAt: new Date() } });

    return { success: true, message: `Partial delivery recorded. Status: ${status}` };
  } catch (error) {
    console.error("Record partial delivery error:", error);
    return { success: false, message: "Failed to record partial delivery" };
  }
}

export async function deleteDelivery(id: string): Promise<ActionResponse> {
  try {
    const delivery = await prisma.deliveryNote.findUnique({ where: { id } });
    if (!delivery) return { success: false, message: "Delivery note not found" };
    if (delivery.status !== "draft") return { success: false, message: "Only draft deliveries can be deleted" };

    await prisma.deliveryNote.delete({ where: { id } });
    return { success: true, message: "Delivery note deleted" };
  } catch (error) {
    console.error("Delete delivery error:", error);
    return { success: false, message: "Failed to delete delivery note" };
  }
}
