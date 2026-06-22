import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BrandList } from "@/features/catalog/brands/components/brand-list";
import { BrandForm } from "@/features/catalog/brands/components/brand-form";
import { DialogForm } from "@/components/ui/dialog-form";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { params: Promise<{ businessId: string }> }

export default async function BrandsPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Brands" description="Manage product brands">
        <DialogForm title="Add Brand" description="Add a new brand">
          <BrandForm mode="create" businessId={businessId} />
        </DialogForm>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <BrandList businessId={businessId} />
      </Suspense>
    </div>
  );
}
