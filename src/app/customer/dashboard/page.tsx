import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyCustomerJWT, getCustomerProfile } from "@/features/customer/auth/service/customer-auth";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/customer/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerOrders } from "@/features/customer/orders/services/order-service";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { getCustomerBookings } from "@/features/customer/bookings/services/booking-service";
import { User, Package, ShoppingBag, Calendar, Wrench, Globe, ArrowRight } from "lucide-react";

export default async function CustomerDashboardPage(props: { searchParams: Promise<{ business?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/customer/auth/login");

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const profile = await getCustomerProfile(payload.sub);
  if (!profile) redirect("/customer/auth/login");

  let recentOrders: { id: string; grandTotal: unknown; status: string; saleDate: Date; items: unknown[] }[] = [];
  try {
    const business = await getBusinessBySlug(businessSlug);
    if (business?.id) {
      recentOrders = await getCustomerOrders(payload.sub, business.id);
      recentOrders = recentOrders.slice(0, 5);
    }
  } catch {
    // Business not resolved — skip orders section
  }

  let recentBookings: { id: string; status: string; startTime: Date | null; title: string | null }[] = [];
  try {
    if (business?.id) {
      const allBookings = await getCustomerBookings(payload.sub, business.id);
      recentBookings = allBookings.slice(0, 3).map((b) => ({
        id: b.id, status: b.status, startTime: b.startTime, title: b.title || b.catalogItem?.name || null,
      }));
    }
  } catch {
    // skip
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hi, {profile.firstName}</h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
        <form>
          <Button type="submit" formAction={logoutAction} variant="outline">Sign Out</Button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{profile.firstName} {profile.lastName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentOrders.length}</p>
          </CardContent>
        </Card>
        <Link href={`/customer/catalog?business=${businessSlug}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Shop</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Browse Catalog <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/customer/bookings?business=${businessSlug}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                {recentBookings.length} upcoming <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/customer/installations?business=${businessSlug}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Installation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Track Progress <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/storefront/enkai-demo-shop`}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Storefront</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                View Online Shop <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {recentOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/customer/orders/${order.id}?business=${businessSlug}`}
                className="flex items-center justify-between border rounded-lg p-3 hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.saleDate).toLocaleDateString("en-TZ", { month: "short", day: "numeric" })}
                    {" "}· {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Number(order.grandTotal).toLocaleString()} TZS</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === "completed" ? "bg-green-100 text-green-800" :
                    order.status === "cancelled" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Link href={`/customer/orders?business=${businessSlug}`} className="text-sm text-primary hover:underline block text-center">
            View All Orders
          </Link>
        </div>
      )}

      {recentOrders.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-2">No orders yet</p>
          <Link
            href={`/customer/catalog?business=${businessSlug}`}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg inline-block hover:bg-primary/90"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {recentBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
          <div className="space-y-2">
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/customer/bookings/${booking.id}?business=${businessSlug}`}
                className="flex items-center justify-between border rounded-lg p-3 hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{booking.title || "Booking"}</p>
                  {booking.startTime && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.startTime).toLocaleDateString("en-TZ", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                  booking.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {booking.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
          <Link href={`/customer/bookings?business=${businessSlug}`} className="text-sm text-primary hover:underline block text-center">
            View All Bookings
          </Link>
        </div>
      )}
    </div>
  );
}
