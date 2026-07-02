import { notFound } from "next/navigation";
import Link from "next/link";
import { getStorefrontBySubdomain } from "@/features/storefront/services/storefront-service";
import { getBusinessCatalog, getCatalogCategories } from "@/features/customer/catalog/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function StorefrontPage(props: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { subdomain } = await props.params;
  const searchParams = await props.searchParams;
  const storefront = await getStorefrontBySubdomain(subdomain);
  if (!storefront) return notFound();

  const theme = storefront.themes[0];
  const [catalog, categories] = await Promise.all([
    getBusinessCatalog(storefront.business.id, { category: searchParams.category, search: searchParams.search }),
    getCatalogCategories(storefront.business.id),
  ]);

  const colors = {
    primary: storefront.primaryColor,
    secondary: storefront.secondaryColor,
    accent: storefront.accentColor,
  };

  return (
    <div style={{ fontFamily: storefront.fontFamily || "Inter, sans-serif" }}>
      <style>{`
        :root { --primary: ${colors.primary}; --primary-foreground: #fff; }
        .btn-primary { background-color: ${colors.primary}; color: white; }
        .btn-primary:hover { opacity: 0.9; }
        .border-primary { border-color: ${colors.primary}; }
        .text-primary { color: ${colors.primary}; }
      `}</style>

      <header className={`border-b ${theme?.headerStyle === "hero" ? "bg-gradient-to-r from-primary/10 to-transparent py-8" : "py-4"}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              {storefront.logoUrl && (
                <img src={storefront.logoUrl} alt={storefront.name} className="h-10 mb-1" />
              )}
              <h1 className="text-2xl font-bold">{storefront.name}</h1>
              {storefront.tagline && <p className="text-muted-foreground">{storefront.tagline}</p>}
            </div>
            {storefront.enableCart && (
              <Link
                href={`/customer/cart?business=${storefront.business.slug}`}
                className="btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Cart
              </Link>
            )}
          </div>
        </div>
      </header>

      {storefront.announcementEnabled && storefront.announcement && (
        <div className="bg-muted text-center py-2 text-sm" style={{ backgroundColor: colors.accent + "20" }}>
          {storefront.announcement}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <Link
              href={`/storefront/${subdomain}`}
              className={`px-4 py-2 rounded-full text-sm ${
                !searchParams.category ? "btn-primary" : "bg-muted hover:bg-muted/80"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/storefront/${subdomain}?category=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm ${
                  searchParams.category === cat.slug ? "btn-primary" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
          theme?.cardStyle === "flat" ? "" : "gap-4"
        }`}>
          {catalog.items.map((item) => (
            <Link
              key={item.id}
              href={`/storefront/${subdomain}/${item.slug}`}
              className={`group border rounded-lg p-4 hover:shadow-md transition-shadow space-y-2 ${
                theme?.cardStyle === "flat" ? "rounded-none border-x-0 border-t-0" : "rounded-lg"
              }`}
              style={{ borderColor: colors.primary + "20" }}
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
                <p className="text-lg font-bold mt-1" style={{ color: colors.primary }}>
                  {Number(item.price).toLocaleString()} {storefront.business.currency}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {catalog.items.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No items found</p>
        )}
      </main>

      <footer className={`border-t mt-12 ${
        theme?.footerStyle === "minimal" ? "py-6" :
        theme?.footerStyle === "classic" ? "py-12 bg-muted/30" :
        "py-8"
      }`}>
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {storefront.name}. Powered by Enkai.</p>
        </div>
      </footer>
    </div>
  );
}
