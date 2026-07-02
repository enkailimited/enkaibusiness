import { notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessBySlug, getCatalogItem } from "@/features/customer/catalog/services/catalog-service";
import { AddToCartForm } from "@/features/customer/catalog/components/add-to-cart-form";

export default async function CatalogItemPage(props: { params: Promise<{ slug: string }>; searchParams: Promise<{ business?: string }> }) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";
  const business = await getBusinessBySlug(businessSlug);
  if (!business) return notFound();

  const item = await getCatalogItem(business.id, slug);
  if (!item) return notFound();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href={`/customer/catalog?business=${businessSlug}`} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        ← Back to catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
          <span className="text-6xl">📦</span>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            {item.sku && <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>}
          </div>

          {item.category && (
            <p className="text-sm text-muted-foreground">Category: {item.category.name}</p>
          )}

          {item.description && <p className="text-muted-foreground">{item.description}</p>}

          <p className="text-3xl font-bold">{Number(item.price).toLocaleString()} {business.currency}</p>

          {item.variants && item.variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Variants:</p>
              {item.variants.map((v) => (
                <div key={v.id} className="flex justify-between text-sm border-b pb-1">
                  <span>{v.name}</span>
                  <span className="font-medium">{Number(v.price || item.price).toLocaleString()} {business.currency}</span>
                </div>
              ))}
            </div>
          )}

          {item.isService ? (
            <Link
              href={`/customer/book/new?business=${businessSlug}&service=${item.slug}`}
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 text-center"
            >
              Book This Service
            </Link>
          ) : (
            <AddToCartForm item={item} businessSlug={businessSlug} />
          )}
        </div>
      </div>
    </div>
  );
}
