import { requireAuth } from "@/server/auth";
import { getWorkspaceBusinesses } from "../services/business-service";
import { BusinessCard } from "./business-card";
import { EmptyState } from "@/components/shared/empty-state";

interface BusinessListProps {
  workspaceId: string;
}

export async function BusinessList({ workspaceId }: BusinessListProps) {
  await requireAuth();
  const businesses = await getWorkspaceBusinesses(workspaceId);

  if (businesses.length === 0) {
    return (
      <EmptyState
        title="No businesses yet"
        description="Create your first business in this workspace."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
}
