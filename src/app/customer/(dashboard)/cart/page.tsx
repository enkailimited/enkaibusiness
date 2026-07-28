import Link from "next/link";
import { cookies } from "next/headers";
import { parseCart, cartTotal } from "@/features/customer/cart/cart-service";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { CartClient } from "@/features/customer/cart/components/cart-client";

export const dynamic = "force-dynamic";

export default async function CartPage(props: { searchParams: Promise<{ business?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";
  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  const cookieStore = await cookies();
  const items = parseCart(cookieStore.get(`cart_${businessSlug}`)?.value);
  const total = cartTotal(items);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">{business.name}</p>
        </div>
        <Link href={`/customer/catalog?business=${businessSlug}`} className="text-sm text-primary hover:underline">
          Continue Shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">Your cart is empty</p>
          <Link
            href={`/customer/catalog?business=${businessSlug}`}
            className="text-primary hover:underline"
          >
            Browse catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <CartClient items={items} businessSlug={businessSlug} />

          <div className="border-t pt-4 flex items-center justify-between">
            <p className="text-xl font-bold">Total: {total.toLocaleString()} {business.currency}</p>
            <Link
              href={`/customer/checkout?business=${businessSlug}`}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
