import Link from "next/link";
import { cookies } from "next/headers";
import { getBusinessBySlug, getBusinessCatalog, getCatalogCategories } from "@/features/customer/catalog/services/catalog-service";
import { parseCart } from "@/features/customer/cart/cart-service";

export const dynamic = "force-dynamic";

export default async function CustomerCatalogPage(props: { searchParams: Promise<{ business?: string; category?: string; search?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";
  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  const [catalog, categories] = await Promise.all([
    getBusinessCatalog(business.id, { category: searchParams.category, search: searchParams.search }),
    getCatalogCategories(business.id),
  ]);

  const cookieStore = await cookies();
  const cartItems = parseCart(cookieStore.get(`cart_${businessSlug}`)?.value);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground">Browse our catalog</p>
        </div>
        <Link href={`/customer/cart?business=${businessSlug}`} className="text-primary hover:underline">
          View Cart ({cartItems.length})
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/customer/catalog?business=${businessSlug}`}
            className={`px-4 py-2 rounded-full text-sm ${!searchParams.category ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/customer/catalog?business=${businessSlug}&category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm ${searchParams.category === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {catalog.items.map((item) => (
          <Link
            key={item.id}
            href={`/customer/catalog/${item.slug}?business=${businessSlug}`}
            className="group border rounded-lg p-4 hover:shadow-md transition-shadow space-y-2"
          >
            <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                <span className="text-4xl">📦</span>
              )}
            </div>
            <div>
              <h3 className="font-medium group-hover:text-primary transition-colors">{item.name}</h3>
              {item.unit && <p className="text-xs text-muted-foreground">per {item.unit.abbreviation}</p>}
              <p className="text-lg font-bold mt-1">{Number(item.price).toLocaleString()} {business.currency}</p>
            </div>
          </Link>
        ))}
      </div>

      {catalog.items.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No items found</p>
      )}
    </div>
  );
}
