import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProductList } from "@/features/catalog/products/components/product-list";
import { ProductForm } from "@/features/catalog/products/components/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listProducts } from "@/features/catalog/products/services/product-service";

interface Props { params: Promise<{ businessId: string }> }

async function ProductSection({ businessId }: { businessId: string }) {
  await requireAuth();
  const result = await listProducts(businessId);
  return <ProductList products={result.data ?? []} />;
}

export default async function ProductsPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Products" description="Manage your product catalog">
        <ProductForm businessId={businessId} />
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <ProductSection businessId={businessId} />
      </Suspense>
    </div>
  );
}
