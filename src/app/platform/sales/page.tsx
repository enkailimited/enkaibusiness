import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PlatformSalesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Platform sales management"
      />
      <EmptyState
        title="No sales data"
        description="Sales features will be available in a future update"
      />
    </div>
  );
}
