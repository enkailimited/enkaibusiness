import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogList } from "@/features/catalog/components/catalog-list";
import { CatalogForm } from "@/features/catalog/components/catalog-form";
import { DialogForm } from "@/components/ui/dialog-form";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { getBusinessCatalog } from "@/features/catalog/services/catalog-service";

interface Props { params: Promise<{ businessId: string }> }

async function CatalogContent({ businessId }: { businessId: string }) {
  await requireAuth();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      modes: { select: { industry: true } },
    },
  });

  const [result, categories, brands, units] = await Promise.all([
    getBusinessCatalog(businessId),
    prisma.category.findMany({ where: { businessId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { businessId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ where: { businessId }, select: { id: true, name: true, abbreviation: true }, orderBy: { name: "asc" } }),
  ]);

  const isCommerce = business?.modes.some((m) => m.industry === "COMMERCE");

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Catalog" description="Manage catalog items">
        <DialogForm
          title="Add Catalog Item"
          description={isCommerce ? "Add a new product to your catalog" : "Add a new item to your catalog"}
        >
          <CatalogForm
            mode="create"
            businessId={businessId}
            categories={categories}
            brands={brands}
            units={units}
            commerceCatalogTypes={isCommerce ? ["product"] : undefined}
          />
        </DialogForm>
      </PageHeader>
      <CatalogList
        items={result.items}
        businessId={businessId}
        categories={categories}
        brands={brands}
        units={units}
        commerceCatalogTypes={isCommerce ? ["product"] : undefined}
      />
    </div>
  );
}

export default async function CatalogPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <CatalogContent businessId={businessId} />
    </Suspense>
  );
}
