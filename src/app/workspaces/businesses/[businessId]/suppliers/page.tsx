import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SupplierList } from "@/features/suppliers/components/supplier-list";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { params: Promise<{ businessId: string }> }

export default async function SuppliersPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Suppliers" description="Manage your suppliers">
        <SupplierForm businessId={businessId} />
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <SupplierList businessId={businessId} />
      </Suspense>
    </div>
  );
}
