"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RoleWithUserCount } from "../types";

interface RoleListProps {
  roles: RoleWithUserCount[];
  onEdit?: (role: RoleWithUserCount) => void;
  onDelete?: (roleId: string) => void;
}

export function RoleList({ roles, onEdit, onDelete }: RoleListProps) {
  if (roles.length === 0) {
    return <p className="text-sm text-muted-foreground">No roles found</p>;
  }

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div key={role.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{role.name}</span>
              <Badge variant={role.scope === "PLATFORM" ? "default" : "secondary"}>
                {role.scope}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {role.description || role.slug} &middot; {role._count?.userRoles ?? 0} users
            </p>
          </div>
          <div className="flex gap-2">
            {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(role)}>Edit</Button>}
            {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(role.id)}>Delete</Button>}
          </div>
        </div>
      ))}
    </div>
  );
}
