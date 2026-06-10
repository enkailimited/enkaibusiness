import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function WorkspaceMembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage workspace members"
      />
      <EmptyState
        title="No members yet"
        description="Invite members to collaborate on this workspace"
      />
    </div>
  );
}
