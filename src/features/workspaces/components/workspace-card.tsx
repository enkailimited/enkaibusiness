import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import type { WorkspaceWithCount } from "../types";

interface WorkspaceCardProps {
  workspace: WorkspaceWithCount;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{workspace.name}</CardTitle>
              <CardDescription>{workspace.slug}</CardDescription>
            </div>
          </div>
          <Badge variant={workspace.isActive ? "success" : "secondary"}>
            {workspace.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {workspace._count.members} members
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {workspace._count.businesses} businesses
          </span>
        </div>
        {workspace.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {workspace.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
