import { requireAuth } from "@/server/auth";
import { getRecentActivities } from "../services/activity-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ACTIVITY_ACTION_LABELS, RESOURCE_TYPE_LABELS } from "../constants";
import { formatDate } from "@/lib/utils";
import { History } from "lucide-react";

interface ActivityFeedProps {
  limit?: number;
}

export async function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  await requireAuth();
  const activities = await getRecentActivities(limit);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {activities.map((activity, i) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 py-3 ${i < activities.length - 1 ? "border-b" : ""}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {activity.user.firstName[0]}
                {activity.user.lastName?.[0] ?? ""}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">
                  {activity.user.firstName}
                  {activity.user.lastName ? ` ${activity.user.lastName}` : ""}
                </span>{" "}
                {ACTIVITY_ACTION_LABELS[activity.action]?.toLowerCase() ?? activity.action}{" "}
                <span className="text-muted-foreground">
                  {RESOURCE_TYPE_LABELS[activity.resourceType]?.toLowerCase() ?? activity.resourceType}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
