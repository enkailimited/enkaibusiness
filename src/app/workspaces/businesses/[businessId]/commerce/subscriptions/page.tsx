import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessSubscriptionView } from "./business-subscription-view";

interface Props { params: Promise<{ businessId: string }> }

export default async function SubscriptionsPage({ params }: Props) {
  const { businessId } = await params;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Subscription" description="Manage business subscription plan and status" />
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
        <BusinessSubscriptionView businessId={businessId} />
      </Suspense>
    </div>
  );
}
