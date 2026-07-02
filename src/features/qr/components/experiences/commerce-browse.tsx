import Link from "next/link";
import { getBusinessCatalog } from "@/features/customer/catalog/services/catalog-service";

export async function QrCommerceBrowse({ businessId, businessSlug, currency }: { businessId: string; businessSlug: string; currency: string }) {
  const catalog = await getBusinessCatalog(businessId, { limit: 8 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse Products</h1>
        <p className="text-muted-foreground">Scan to explore our catalog</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {catalog.items.map((item) => (
          <Link
            key={item.id}
            href={`/customer/catalog/${item.slug}?business=${businessSlug}`}
            className="border rounded-lg p-3 hover:shadow-md transition-shadow space-y-2"
          >
            <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                <span className="text-3xl">📦</span>
              )}
            </div>
            <p className="text-sm font-medium leading-tight">{item.name}</p>
            <p className="text-sm font-bold">{Number(item.price).toLocaleString()} {currency}</p>
          </Link>
        ))}
      </div>

      {catalog.items.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No products available</p>
      )}
    </div>
  );
}
