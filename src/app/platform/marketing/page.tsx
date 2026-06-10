import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PlatformMarketingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Marketing" description="Platform marketing management" />
      <EmptyState title="No campaigns" description="Marketing features will be available in a future update" />
    </div>
  );
}
