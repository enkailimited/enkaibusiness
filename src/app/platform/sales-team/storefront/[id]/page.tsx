import { notFound } from "next/navigation";
import Link from "next/link";
import { getStorefrontById } from "@/features/storefront/services/storefront-service";
import { PageHeader } from "@/components/layout/page-header";
import { StorefrontActions } from "@/features/storefront/components/storefront-actions";
import { ThemeSelector } from "@/features/storefront/components/theme-selector";
import { Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StorefrontDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const sf = await getStorefrontById(id);
  if (!sf) return notFound();

  return (
    <div className="space-y-6 pb-10">
      <Link href="/platform/sales-team/storefront" className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to storefronts
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <div>
            <PageHeader title={sf.name} description={sf.business.name} />
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                sf.status === "PUBLISHED" ? "bg-green-100 text-green-800" :
                sf.status === "ARCHIVED" ? "bg-gray-100 text-gray-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {sf.status}
              </span>
              <Link
                href={`/storefront/${sf.subdomain}`}
                target="_blank"
                className="text-xs text-primary hover:underline"
              >
                /storefront/{sf.subdomain} ↗
              </Link>
            </div>
          </div>
        </div>
        <StorefrontActions storefrontId={sf.id} status={sf.status} />
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-4 mb-4" style={{ color: sf.primaryColor }}>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: sf.primaryColor }} />
          <div className="w-8 h-8 rounded" style={{ backgroundColor: sf.secondaryColor }} />
          <div className="w-8 h-8 rounded" style={{ backgroundColor: sf.accentColor }} />
          <span className="text-sm text-muted-foreground">Theme Colors</span>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Subdomain</dt>
            <dd className="font-medium font-mono">{sf.subdomain}</dd>
          </div>
          {sf.customDomain && (
            <div>
              <dt className="text-muted-foreground">Custom Domain</dt>
              <dd className="font-medium">{sf.customDomain}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Tagline</dt>
            <dd className="font-medium">{sf.tagline || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Published</dt>
            <dd className="font-medium">{sf.publishedAt ? new Date(sf.publishedAt).toLocaleDateString() : "Not published"}</dd>
          </div>
        </dl>

        {sf.description && (
          <p className="text-sm text-muted-foreground mt-4">{sf.description}</p>
        )}
      </div>

      <ThemeSelector themes={sf.themes.map((t) => ({
        id: t.id, name: t.name, isActive: t.isActive,
        layout: t.layout, headerStyle: t.headerStyle, cardStyle: t.cardStyle,
      }))} storefrontId={sf.id} />
    </div>
  );
}
