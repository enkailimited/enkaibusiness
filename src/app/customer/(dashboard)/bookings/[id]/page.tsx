import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { getBookingById } from "@/features/customer/bookings/services/booking-service";
import { CancelBookingButton } from "@/features/customer/bookings/components/cancel-booking-button";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ business?: string }> }) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/bookings/${id}?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return notFound();

  const booking = await getBookingById(id, payload.sub);
  if (!booking) return notFound();

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href={`/customer/bookings?business=${businessSlug}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to bookings
      </Link>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{booking.title || booking.catalogItem?.name || "Booking"}</h1>
            <p className="text-sm text-muted-foreground">Ref: {booking.bookingNumber}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${
            booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
            booking.status === "CANCELLED" || booking.status === "NO_SHOW" ? "bg-red-100 text-red-800" :
            booking.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
            booking.status === "CHECKED_IN" || booking.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-800" :
            "bg-yellow-100 text-yellow-800"
          }`}>
            {booking.status.replace("_", " ")}
          </span>
        </div>

        {booking.description && <p className="text-muted-foreground">{booking.description}</p>}

        <div className="grid grid-cols-2 gap-4 text-sm">
          {booking.startTime && (
            <div>
              <span className="text-muted-foreground">Start</span>
              <p>{new Date(booking.startTime).toLocaleString("en-TZ")}</p>
            </div>
          )}
          {booking.endTime && (
            <div>
              <span className="text-muted-foreground">End</span>
              <p>{new Date(booking.endTime).toLocaleString("en-TZ")}</p>
            </div>
          )}
          {booking.partySize && (
            <div>
              <span className="text-muted-foreground">Guests</span>
              <p>{booking.partySize}</p>
            </div>
          )}
          {booking.durationMinutes && (
            <div>
              <span className="text-muted-foreground">Duration</span>
              <p>{booking.durationMinutes} min</p>
            </div>
          )}
        </div>

        {booking.specialRequests && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Special Requests</p>
            <p className="text-sm text-muted-foreground">{booking.specialRequests}</p>
          </div>
        )}

        {booking.notes && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Notes</p>
            <p className="text-sm text-muted-foreground">{booking.notes}</p>
          </div>
        )}
      </div>

      {booking.items.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Items</h2>
          {booking.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border rounded-lg p-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">x{Number(item.quantity)} @ {Number(item.unitPrice).toLocaleString()}</p>
              </div>
              <p className="font-medium">{Number(item.subtotal).toLocaleString()} {booking.currency}</p>
            </div>
          ))}
        </div>
      )}

      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{Number(booking.total || 0).toLocaleString()} {booking.currency}</span>
        </div>
      </div>

      <div className="flex gap-4">
        {booking.catalogItem && (
          <Link href={`/customer/catalog/${booking.catalogItem.slug}?business=${businessSlug}`} className="text-sm text-primary hover:underline">
            View Service
          </Link>
        )}
        {canCancel && <CancelBookingButton bookingId={booking.id} businessSlug={businessSlug} />}
      </div>
    </div>
  );
}
