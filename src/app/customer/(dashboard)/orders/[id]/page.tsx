import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { getOrderById } from "@/features/customer/orders/services/order-service";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ business?: string }> }) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/orders/${id}?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return notFound();

  const order = await getOrderById(id, payload.sub, business.id);
  if (!order) return notFound();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href={`/customer/orders?business=${businessSlug}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to orders
      </Link>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.saleDate).toLocaleDateString("en-TZ", {
                year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${
            order.status === "completed" ? "bg-green-100 text-green-800" :
            order.status === "cancelled" ? "bg-red-100 text-red-800" :
            order.status === "draft" ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {order.notes && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Notes</p>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border rounded-lg p-4">
            <div className="flex-1 min-w-0">
              <Link
                href={`/customer/catalog/${item.catalogItem.slug}?business=${businessSlug}`}
                className="font-medium hover:text-primary truncate block"
              >
                {item.catalogItem.name}
              </Link>
              {item.catalogItem.sku && (
                <p className="text-xs text-muted-foreground">SKU: {item.catalogItem.sku}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {Number(item.quantity)} x {Number(item.unitPrice).toLocaleString()}
              </p>
              <p className="font-medium">{Number(item.subtotal).toLocaleString()} TZS</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{Number(order.subtotal).toLocaleString()} TZS</span>
        </div>
        {Number(order.discountTotal) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-green-600">-{Number(order.discountTotal).toLocaleString()} TZS</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>{Number(order.taxTotal).toLocaleString()} TZS</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>{Number(order.grandTotal).toLocaleString()} TZS</span>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Customer Details</h2>
        <p className="text-sm text-muted-foreground">{order.customer.firstName} {order.customer.lastName}</p>
        {order.customer.email && <p className="text-sm text-muted-foreground">{order.customer.email}</p>}
        {order.customer.phone && <p className="text-sm text-muted-foreground">{order.customer.phone}</p>}
      </div>

      <div className="flex gap-4">
        <Link
          href={`/customer/catalog?business=${businessSlug}`}
          className="text-sm text-primary hover:underline"
        >
          Continue Shopping
        </Link>
        <Link
          href={`/customer/orders?business=${businessSlug}`}
          className="text-sm text-primary hover:underline"
        >
          View All Orders
        </Link>
      </div>
    </div>
  );
}
