import { requireAuth } from "@/server/auth";
import { getTeamTree } from "../services/profile-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABELS } from "../constants";
import type { ProfileWithTree } from "../types";

interface TeamTreeProps {
  managerId: string;
}

function TreeNode({ profile, depth }: { profile: ProfileWithTree; depth: number }) {
  const statusVariant = profile.status === "ACTIVE" ? "default" : profile.status === "INACTIVE" ? "secondary" : "destructive";

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="flex items-center gap-3 py-2">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        <span className="font-medium text-sm">
          {profile.user.firstName} {profile.user.lastName}
        </span>
        {profile.hierarchy && (
          <Badge variant="outline" className="text-xs">{profile.hierarchy.title}</Badge>
        )}
        <Badge variant={statusVariant} className="text-xs">
          {PROFILE_STATUS_LABELS[profile.status] ?? profile.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {profile._count?.leads ?? 0} leads
        </span>
      </div>
      {profile.children?.map((child) => (
        <TreeNode key={child.id} profile={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export async function TeamTree({ managerId }: TeamTreeProps) {
  await requireAuth();
  const root = await getTeamTree(managerId);

  if (!root) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Sales profile not found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Team: {root.user.firstName} {root.user.lastName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-l-2 border-muted pl-4">
          <div className="flex items-center gap-3 py-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="font-semibold">
              {root.user.firstName} {root.user.lastName}
            </span>
            {root.hierarchy && (
              <Badge variant="secondary">{root.hierarchy.title}</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {root._count?.leads ?? 0} leads
            </span>
          </div>
          {root.children?.map((child) => (
            <TreeNode key={child.id} profile={child} depth={1} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
