import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PlatformSupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Customer support management" />
      <EmptyState
        title="No support tickets"
        description="Support features will be available in a future update"
      />
    </div>
  );
}
