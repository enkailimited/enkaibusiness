import Link from "next/link";
import { getBusinessCatalog } from "@/features/customer/catalog/services/catalog-service";

export async function QrRestaurantMenu({ businessId, businessSlug, currency }: { businessId: string; businessSlug: string; currency: string }) {
  const catalog = await getBusinessCatalog(businessId, { limit: 50 });

  const categories = catalog.items.reduce<Record<string, typeof catalog.items>>((acc, item) => {
    const cat = item.category?.name || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Our Menu</h1>
        <p className="text-muted-foreground">Scan to view & order</p>
      </div>

      {Object.entries(categories).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-xl font-semibold border-b pb-2 mb-3">{category}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <p className="font-bold whitespace-nowrap ml-4">
                  {Number(item.price).toLocaleString()} {currency}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center pt-4">
        <Link
          href={`/customer/catalog?business=${businessSlug}`}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-block hover:bg-primary/90"
        >
          Order Online
        </Link>
      </div>
    </div>
  );
}
