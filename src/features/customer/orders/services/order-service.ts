import "server-only";
import { prisma } from "@/server/db";

export async function getCustomerOrders(customerId: string, businessId: string) {
  return prisma.sale.findMany({
    where: { customer: { userId: customerId }, businessId },
    select: {
      id: true,
      saleDate: true,
      grandTotal: true,
      status: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          catalogItem: { select: { name: true, slug: true, imageUrl: true } },
        },
      },
    },
    orderBy: { saleDate: "desc" },
    take: 50,
  });
}

export async function getOrderById(orderId: string, customerId: string, businessId: string) {
  return prisma.sale.findFirst({
    where: { id: orderId, customer: { userId: customerId }, businessId },
    select: {
      id: true,
      saleDate: true,
      grandTotal: true,
      subtotal: true,
      discountTotal: true,
      taxTotal: true,
      status: true,
      notes: true,
      customer: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          discount: true,
          subtotal: true,
          catalogItem: { select: { name: true, slug: true, sku: true, imageUrl: true } },
        },
      },
    },
  });
}
