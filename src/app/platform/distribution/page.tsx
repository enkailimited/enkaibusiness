import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PlatformDistributionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Distribution" description="Manage distribution network" />
      <EmptyState title="No distribution data" description="Distribution features will be available in a future update" />
    </div>
  );
}
