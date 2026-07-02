import "server-only";
import { prisma } from "@/server/db";

/**
 * Get available time slots for a given date.
 * Returns slots that aren't already reserved.
 */
export async function getAvailableSlots(businessId: string, date: string, guests: number = 2) {
  const dayStart = new Date(`${date}T00:00:00+03:00`);
  const dayEnd = new Date(`${date}T23:59:59+03:00`);

  const existingReservations = await prisma.reservation.findMany({
    where: {
      businessId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ["pending", "confirmed", "checked_in"] },
    },
    select: { startTime: true, guests: true },
  });

  const reservedSlots = new Set(
    existingReservations.map((r) => r.startTime.toISOString()),
  );

  const allSlots: string[] = [];
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const slot = `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+03:00`;
      if (reservedSlots.has(slot)) continue;
      allSlots.push(slot);
    }
  }

  return { date, guests, availableSlots: allSlots };
}

export async function createReservation(data: {
  businessId: string; branchId?: string; customerId: string;
  catalogItemId?: string; bookingId?: string;
  startTime: string; endTime?: string; guests?: number; notes?: string;
}) {
  return prisma.reservation.create({
    data: {
      businessId: data.businessId,
      branchId: data.branchId || null,
      customerId: data.customerId,
      catalogItemId: data.catalogItemId || null,
      bookingId: data.bookingId || null,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      guests: data.guests || null,
      status: "pending",
      notes: data.notes || null,
    },
  });
}

export async function getCustomerReservations(customerId: string, businessId: string) {
  return prisma.reservation.findMany({
    where: { customerId, businessId },
    select: {
      id: true, startTime: true, endTime: true, guests: true,
      status: true, notes: true, createdAt: true,
    },
    orderBy: { startTime: "desc" },
    take: 50,
  });
}

export async function cancelReservation(reservationId: string, customerId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, customerId, status: { in: ["pending", "confirmed"] } },
  });
  if (!reservation) return { success: false, message: "Reservation not found or cannot be cancelled" };

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "cancelled" },
  });

  return { success: true, message: "Reservation cancelled" };
}
