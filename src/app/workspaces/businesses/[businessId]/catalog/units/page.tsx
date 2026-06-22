import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UnitList } from "@/features/catalog/units/components/unit-list";
import { UnitForm } from "@/features/catalog/units/components/unit-form";
import { DialogForm } from "@/components/ui/dialog-form";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { params: Promise<{ businessId: string }> }

export default async function UnitsPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Units of Measure" description="Manage product measurement units">
        <DialogForm title="Add Unit" description="Add a new unit of measure">
          <UnitForm mode="create" businessId={businessId} />
        </DialogForm>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <UnitList businessId={businessId} />
      </Suspense>
    </div>
  );
}
