import "server-only";
import { prisma } from "@/server/db";

/**
 * Fetch catalog items that are flagged as services and can be booked.
 */
export async function getBookableServices(businessId: string) {
  return prisma.catalogItem.findMany({
    where: { businessId, isService: true, isActive: true },
    select: {
      id: true, name: true, slug: true, sku: true, description: true,
      price: true, imageUrl: true, itemType: true,
      category: { select: { id: true, name: true, slug: true } },
      unit: { select: { id: true, name: true, abbreviation: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createBooking(data: {
  accountId: string; businessId: string; branchId?: string;
  catalogItemId: string; title?: string; description?: string;
  startTime: string; endTime?: string; durationMinutes?: number;
  partySize?: number; quantity: number; unitPrice: number;
  notes?: string; specialRequests?: string;
}) {
  const now = new Date();
  const bookingNumber = `BK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const subtotal = data.unitPrice * data.quantity;
  const total = subtotal;

  const booking = await prisma.booking.create({
    data: {
      accountId: data.accountId,
      businessId: data.businessId,
      branchId: data.branchId || null,
      type: "BOOKING",
      status: "PENDING",
      bookingNumber,
      title: data.title || null,
      description: data.description || null,
      quantity: data.quantity,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      durationMinutes: data.durationMinutes || null,
      partySize: data.partySize || null,
      catalogItemId: data.catalogItemId,
      subtotal,
      total,
      currency: "TZS",
      notes: data.notes || null,
      specialRequests: data.specialRequests || null,
      items: {
        create: {
          catalogItemId: data.catalogItemId,
          name: data.title || "Booking",
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          subtotal,
        },
      },
    },
    include: { items: true, catalogItem: { select: { name: true, slug: true } } },
  });

  return booking;
}

export async function getCustomerBookings(accountId: string, businessId: string) {
  return prisma.booking.findMany({
    where: { accountId, businessId },
    select: {
      id: true, bookingNumber: true, type: true, status: true,
      title: true, startTime: true, endTime: true,
      partySize: true, quantity: true, total: true, currency: true,
      notes: true, createdAt: true,
      catalogItem: { select: { id: true, name: true, slug: true, imageUrl: true } },
      items: { select: { id: true, name: true, quantity: true, unitPrice: true, subtotal: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getBookingById(bookingId: string, accountId: string) {
  return prisma.booking.findFirst({
    where: { id: bookingId, accountId },
    select: {
      id: true, bookingNumber: true, type: true, status: true,
      title: true, description: true, startTime: true, endTime: true,
      durationMinutes: true, partySize: true, quantity: true,
      subtotal: true, discount: true, tax: true, total: true, currency: true,
      paidAmount: true, balanceDue: true,
      notes: true, specialRequests: true,
      checkedInAt: true, completedAt: true, cancelledAt: true, cancellationReason: true,
      createdAt: true, updatedAt: true,
      catalogItem: { select: { id: true, name: true, slug: true, imageUrl: true, description: true } },
      items: { select: { id: true, name: true, quantity: true, unitPrice: true, discount: true, subtotal: true } },
    },
  });
}

export async function cancelBooking(bookingId: string, accountId: string, reason?: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, accountId, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  if (!booking) return { success: false, message: "Booking not found or cannot be cancelled" };

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason || null },
  });

  return { success: true, message: "Booking cancelled" };
}
