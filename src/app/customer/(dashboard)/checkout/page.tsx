import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { parseCart, cartTotal } from "@/features/customer/cart/cart-service";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { CheckoutForm } from "@/features/customer/checkout/components/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage(props: { searchParams: Promise<{ business?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/checkout?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect(`/customer/auth/login?redirect=/customer/checkout?business=${businessSlug}`);

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  const items = parseCart(cookieStore.get(`cart_${businessSlug}`)?.value);
  if (items.length === 0) redirect(`/customer/catalog?business=${businessSlug}`);

  const total = cartTotal(items);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="text-muted-foreground">{business.name}</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          {items.map((item) => (
            <div key={item.catalogItemId} className="flex justify-between text-sm border-b pb-2">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-medium">{(item.price * item.quantity).toLocaleString()} {business.currency}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg pt-2">
            <span>Total</span>
            <span>{total.toLocaleString()} {business.currency}</span>
          </div>
        </div>

        <CheckoutForm
          businessId={business.id}
          workspaceId={business.workspaceId}
          businessSlug={businessSlug}
          customerId={payload.sub}
          total={total}
        />
      </div>
    </div>
  );
}
