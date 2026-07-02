import { notFound } from "next/navigation";
import Link from "next/link";
import { getStorefrontBySubdomain } from "@/features/storefront/services/storefront-service";
import { getCatalogItem } from "@/features/customer/catalog/services/catalog-service";
import { StorefrontAddToCart } from "@/features/storefront/components/storefront-add-to-cart";

export const dynamic = "force-dynamic";

export default async function StorefrontItemPage(props: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await props.params;
  const storefront = await getStorefrontBySubdomain(subdomain);
  if (!storefront) return notFound();

  const item = await getCatalogItem(storefront.business.id, slug);
  if (!item) return notFound();

  const colors = { primary: storefront.primaryColor, secondary: storefront.secondaryColor };

  return (
    <div>
      <header className="border-b py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href={`/storefront/${subdomain}`} className="text-sm hover:underline" style={{ color: colors.primary }}>
            ← Back to {storefront.name}
          </Link>
          {storefront.enableCart && (
            <Link
              href={`/customer/cart?business=${storefront.business.slug}`}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: colors.primary }}
            >
              Cart
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-6xl">📦</span>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{item.name}</h1>
            {item.sku && <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>}
            {item.category && <p className="text-sm text-muted-foreground">{item.category.name}</p>}
            {item.description && <p className="text-muted-foreground">{item.description}</p>}

            <p className="text-3xl font-bold" style={{ color: colors.primary }}>
              {Number(item.price).toLocaleString()} {storefront.business.currency}
            </p>

            {item.variants && item.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Variants:</p>
                {item.variants.map((v) => (
                  <div key={v.id} className="flex justify-between text-sm border-b pb-1">
                    <span>{v.name}</span>
                    <span className="font-medium">{Number(v.price || item.price).toLocaleString()} {storefront.business.currency}</span>
                  </div>
                ))}
              </div>
            )}

            {storefront.enableCart && !item.isService && (
              <StorefrontAddToCart
                item={{ id: item.id, name: item.name, slug: item.slug, price: Number(item.price) }}
                businessSlug={storefront.business.slug}
                primaryColor={colors.primary}
              />
            )}

            {item.isService && storefront.enableBooking && (
              <Link
                href={`/customer/book/new?business=${storefront.business.slug}&service=${item.slug}`}
                className="inline-block text-white px-6 py-3 rounded-lg hover:opacity-90 text-center"
                style={{ backgroundColor: colors.primary }}
              >
                Book This Service
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
