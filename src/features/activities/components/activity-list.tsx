import { requireAuth } from "@/server/auth";
import { getActivities } from "../services/activity-service";
import { DataTable } from "@/components/shared/data-table";
import { ACTIVITY_ACTION_LABELS, RESOURCE_TYPE_LABELS } from "../constants";
import { formatDate } from "@/lib/utils";
import type { ActivityWithUser } from "../types";

interface ActivityListProps {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  page?: number;
}

export async function ActivityList({
  userId,
  action,
  resourceType,
  resourceId,
  page = 1,
}: ActivityListProps) {
  await requireAuth();

  const { data: activities } = await getActivities({
    userId,
    action,
    resourceType,
    resourceId,
    page,
    limit: 20,
  });

  const columns = [
    {
      key: "user",
      header: "User",
      cell: (activity: ActivityWithUser) => (
        <span className="font-medium">
          {activity.user.firstName}
          {activity.user.lastName ? ` ${activity.user.lastName}` : ""}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (activity: ActivityWithUser) => (
        <span>{ACTIVITY_ACTION_LABELS[activity.action] ?? activity.action}</span>
      ),
    },
    {
      key: "resourceType",
      header: "Resource Type",
      cell: (activity: ActivityWithUser) => (
        <span className="text-sm">
          {RESOURCE_TYPE_LABELS[activity.resourceType] ?? activity.resourceType}
        </span>
      ),
    },
    {
      key: "resourceId",
      header: "Resource",
      cell: (activity: ActivityWithUser) => (
        <span className="font-mono text-xs">{activity.resourceId.slice(0, 8)}...</span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (activity: ActivityWithUser) => (
        <span className="text-sm text-muted-foreground">{formatDate(activity.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={activities}
      emptyTitle="No activities found"
      emptyDescription="No activity records match your criteria."
    />
  );
}
