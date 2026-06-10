import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PlatformCommissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Commissions" description="Manage sales commissions" />
      <EmptyState title="No commissions" description="Commission features will be available in a future update" />
    </div>
  );
}
