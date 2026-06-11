import { getUserWorkspaces } from "../services/workspace-service";
import { requireAuth } from "@/server/auth";
import { WorkspaceCard } from "./workspace-card";
import { EmptyState } from "@/components/shared/empty-state";

export async function WorkspaceList() {
  const user = await requireAuth();
  const workspaces = await getUserWorkspaces(user.id);

  if (workspaces.length === 0) {
    return (
      <EmptyState
        title="No workspaces yet"
        description="Create your first workspace to get started."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
}
