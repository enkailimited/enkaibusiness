import { requireAuth } from "@/server/auth";
import { listProfiles } from "../services/profile-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABELS } from "../constants";
import type { ProfileWithCounts, ProfileFilter } from "../types";

interface ProfileListProps {
  filter?: ProfileFilter;
}

export async function ProfileList({ filter }: ProfileListProps) {
  await requireAuth();
  const profiles = await listProfiles(filter);

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (item: ProfileWithCounts) => (
        <span className="font-medium">
          {item.user.firstName} {item.user.lastName}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (item: ProfileWithCounts) => (
        <span className="text-muted-foreground">{item.user.email}</span>
      ),
    },
    {
      key: "hierarchy",
      header: "Hierarchy",
      cell: (item: ProfileWithCounts) =>
        item.hierarchy ? (
          <Badge variant="outline">{item.hierarchy.title}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "manager",
      header: "Manager",
      cell: (item: ProfileWithCounts) =>
        item.manager ? (
          <span className="text-sm">
            {item.manager.user.firstName} {item.manager.user.lastName}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: ProfileWithCounts) => {
        const variant = item.status === "ACTIVE" ? "default" : item.status === "INACTIVE" ? "secondary" : "destructive";
        return (
          <Badge variant={variant}>
            {PROFILE_STATUS_LABELS[item.status] ?? item.status}
          </Badge>
        );
      },
    },
    {
      key: "leads",
      header: "Leads",
      cell: (item: ProfileWithCounts) => (
        <span className="text-muted-foreground">{item._count?.leads ?? 0}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={profiles}
      emptyTitle="No sales profiles found"
      emptyDescription="Create a sales profile to get started."
    />
  );
}
