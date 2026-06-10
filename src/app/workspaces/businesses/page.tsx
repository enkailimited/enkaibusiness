import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function WorkspaceBusinessesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        description="Manage businesses in this workspace"
      />
      <EmptyState
        title="No businesses yet"
        description="Create your first business to get started"
        action={{ label: "Create Business", onClick: () => {} }}
      />
    </div>
  );
}
