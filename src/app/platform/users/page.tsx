import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function PlatformUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage platform users"
      />
      <EmptyState
        title="No users found"
        description="Users will appear here once they register"
      />
    </div>
  );
}
