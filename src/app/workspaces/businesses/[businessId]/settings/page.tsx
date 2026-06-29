import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessSettingsForm } from "@/features/settings/components/business-settings-form";
import { ProcurementSettingsToggle } from "./procurement-toggle";

interface Props { params: Promise<{ businessId: string }> }

export default async function BusinessSettingsPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Business Settings" description="Manage business configuration" />
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div>}>
        <BusinessSettingsForm businessId={businessId} />
      </Suspense>
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-9 w-full" /></div>}>
        <ProcurementSettingsToggle businessId={businessId} />
      </Suspense>
    </div>
  );
}
