import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { getCustomerBookings } from "@/features/customer/bookings/services/booking-service";

export const dynamic = "force-dynamic";

export default async function BookingsPage(props: { searchParams: Promise<{ business?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/bookings?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  const bookings = await getCustomerBookings(payload.sub, business.id);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">{business.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/customer/book/new?business=${businessSlug}`} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90">
            Book a Service
          </Link>
          <Link href={`/customer/reserve?business=${businessSlug}`} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm hover:bg-secondary/80">
            Make a Reservation
          </Link>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 space-y-4 border rounded-lg">
          <p className="text-muted-foreground text-lg">No bookings yet</p>
          <Link href={`/customer/book/new?business=${businessSlug}`} className="text-primary hover:underline">
            Book a service
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/customer/bookings/${booking.id}?business=${businessSlug}`}
              className="block border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{booking.title || booking.catalogItem?.name || `Booking #${booking.bookingNumber.slice(0, 10)}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.startTime ? new Date(booking.startTime).toLocaleDateString("en-TZ", {
                      weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    }) : "Date TBD"}
                  </p>
                  {booking.partySize && <p className="text-xs text-muted-foreground">{booking.partySize} guests</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold">{Number(booking.total || 0).toLocaleString()} {booking.currency}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                    booking.status === "CANCELLED" || booking.status === "NO_SHOW" ? "bg-red-100 text-red-800" :
                    booking.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                    booking.status === "CHECKED_IN" || booking.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
