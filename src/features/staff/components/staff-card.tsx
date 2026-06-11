"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { StaffWithUser, StaffAssignmentWithDetails } from "../types";

interface StaffCardProps {
  staff: StaffWithUser & { assignments?: StaffAssignmentWithDetails[] };
  onEdit?: (staff: StaffWithUser) => void;
  onAssign?: (staff: StaffWithUser) => void;
}

export function StaffCard({ staff, onEdit, onAssign }: StaffCardProps) {
  const primaryAssignment = staff.assignments?.find((a) => a.isPrimary);
  const levelBadgeVariant = {
    business: "default" as const,
    branch: "secondary" as const,
    store: "outline" as const,
  };

  return (
    <Card className="group">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={staff.user.avatarUrl ?? undefined} />
          <AvatarFallback>{getInitials(staff.user.firstName, staff.user.lastName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-base">
            {staff.user.firstName} {staff.user.lastName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{staff.position || "No position"}</p>
        </div>
        <Badge variant={staff.isActive ? "success" : "secondary"}>
          {staff.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Employee Code</span>
            <span>{staff.employeeCode || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="truncate max-w-[180px]">{staff.user.email}</span>
          </div>
          {primaryAssignment && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assignment</span>
              <Badge variant={levelBadgeVariant[primaryAssignment.level as keyof typeof levelBadgeVariant] ?? "outline"}>
                {primaryAssignment.level}
              </Badge>
            </div>
          )}
        </div>

        {staff.assignments && staff.assignments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {staff.assignments.map((a) => (
              <Badge key={a.id} variant="outline" className="text-xs">
                {a.level}{a.role ? ` - ${a.role.name}` : ""}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(staff)}
              className="text-xs text-primary hover:underline"
            >
              Edit
            </button>
          )}
          {onAssign && (
            <button
              onClick={() => onAssign(staff)}
              className="text-xs text-primary hover:underline"
            >
              Manage Assignments
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
