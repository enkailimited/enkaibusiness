"use server";

import { cookies } from "next/headers";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { createBooking, cancelBooking } from "../services/booking-service";
import { createReservation, cancelReservation } from "../services/reservation-service";

export async function createBookingAction(_prev: unknown, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return { success: false, message: "Not authenticated" };
    const payload = await verifyCustomerJWT(token);
    if (!payload?.sub) return { success: false, message: "Invalid session" };

    const result = await createBooking({
      accountId: payload.sub,
      businessId: formData.get("businessId") as string,
      branchId: (formData.get("branchId") as string) || undefined,
      catalogItemId: formData.get("catalogItemId") as string,
      title: (formData.get("title") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      startTime: formData.get("startTime") as string,
      endTime: (formData.get("endTime") as string) || undefined,
      durationMinutes: Number(formData.get("durationMinutes")) || undefined,
      partySize: Number(formData.get("partySize")) || undefined,
      quantity: Number(formData.get("quantity")) || 1,
      unitPrice: Number(formData.get("unitPrice")) || 0,
      notes: (formData.get("notes") as string) || undefined,
      specialRequests: (formData.get("specialRequests") as string) || undefined,
    });

    return { success: true, message: "Booking created!", data: { id: result.id, bookingNumber: result.bookingNumber } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create booking" };
  }
}

export async function createReservationAction(_prev: unknown, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return { success: false, message: "Not authenticated" };
    const payload = await verifyCustomerJWT(token);
    if (!payload?.sub) return { success: false, message: "Invalid session" };

    const result = await createReservation({
      businessId: formData.get("businessId") as string,
      branchId: (formData.get("branchId") as string) || undefined,
      customerId: payload.sub,
      startTime: formData.get("startTime") as string,
      endTime: (formData.get("endTime") as string) || undefined,
      guests: Number(formData.get("guests")) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    return { success: true, message: "Reservation confirmed!", data: { id: result.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create reservation" };
  }
}

export async function cancelBookingAction(bookingId: string, reason?: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return { success: false, message: "Not authenticated" };
    const payload = await verifyCustomerJWT(token);
    if (!payload?.sub) return { success: false, message: "Invalid session" };

    return await cancelBooking(bookingId, payload.sub, reason);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to cancel" };
  }
}

export async function cancelReservationAction(reservationId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return { success: false, message: "Not authenticated" };
    const payload = await verifyCustomerJWT(token);
    if (!payload?.sub) return { success: false, message: "Invalid session" };

    return await cancelReservation(reservationId, payload.sub);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to cancel" };
  }
}
