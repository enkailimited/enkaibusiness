import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PlatformSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Manage customer subscriptions" />
      <EmptyState title="No subscriptions" description="Subscription billing will be available in a future update" />
    </div>
  );
}
