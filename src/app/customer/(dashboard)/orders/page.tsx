import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { getCustomerOrders } from "@/features/customer/orders/services/order-service";

export const dynamic = "force-dynamic";

export default async function OrdersPage(props: { searchParams: Promise<{ business?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/orders?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  const orders = await getCustomerOrders(payload.sub, business.id);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Link href={`/customer/catalog?business=${businessSlug}`} className="text-sm text-primary hover:underline">
          Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">No orders yet</p>
          <Link href={`/customer/catalog?business=${businessSlug}`} className="text-primary hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/customer/orders/${order.id}?business=${businessSlug}`}
              className="block border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.saleDate).toLocaleDateString("en-TZ", {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Number(order.grandTotal).toLocaleString()} TZS</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === "completed" ? "bg-green-100 text-green-800" :
                    order.status === "cancelled" ? "bg-red-100 text-red-800" :
                    order.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
