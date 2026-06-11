import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BrandList } from "@/features/catalog/brands/components/brand-list";
import { BrandForm } from "@/features/catalog/brands/components/brand-form";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { params: Promise<{ businessId: string }> }

export default async function BrandsPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Brands" description="Manage product brands">
        <BrandForm mode="create" businessId={businessId} />
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
        <BrandList businessId={businessId} />
      </Suspense>
    </div>
  );
}
