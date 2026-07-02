import Link from "next/link";
import { Globe, Plus } from "lucide-react";
import { getStorefronts } from "@/features/storefront/services/storefront-service";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function StorefrontsPage() {
  const storefronts = await getStorefronts();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <PageHeader title="Storefronts" description="Manage online storefronts for businesses" />
        <Link
          href="/platform/sales-team/storefront/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Storefront
        </Link>
      </div>

      {storefronts.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No storefronts yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create storefronts for your businesses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {storefronts.map((sf) => (
            <Link
              key={sf.id}
              href={`/platform/sales-team/storefront/${sf.id}`}
              className="block border rounded-lg p-4 hover:border-primary transition-colors bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{sf.name}</p>
                    {sf.isDefault && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Default</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{sf.business.name}</p>
                  {sf.themes[0] && <p className="text-xs text-muted-foreground">Theme: {sf.themes[0].name}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    sf.status === "PUBLISHED" ? "bg-green-100 text-green-800" :
                    sf.status === "ARCHIVED" ? "bg-gray-100 text-gray-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {sf.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    /storefront/{sf.subdomain}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
