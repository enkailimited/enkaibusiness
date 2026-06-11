"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { StaffWithUser, StaffAssignmentWithDetails } from "../types";

interface StaffListProps {
  staff: (StaffWithUser & { assignments?: StaffAssignmentWithDetails[] })[];
  isLoading?: boolean;
  onRowClick?: (staff: StaffWithUser) => void;
}

export function StaffList({ staff, isLoading, onRowClick }: StaffListProps) {
  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (item: StaffWithUser) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(item.user.firstName, item.user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.user.firstName} {item.user.lastName}</p>
            <p className="text-xs text-muted-foreground">{item.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "position",
      header: "Position",
      cell: (item: StaffWithUser) => (
        <span className="text-sm">{item.position || "-"}</span>
      ),
    },
    {
      key: "employeeCode",
      header: "Code",
      cell: (item: StaffWithUser) => (
        <span className="text-sm text-muted-foreground">{item.employeeCode || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: StaffWithUser) => (
        <Badge variant={item.isActive ? "success" : "secondary"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={staff}
      isLoading={isLoading}
      emptyTitle="No staff found"
      emptyDescription="Add your first staff member to get started."
      onRowClick={onRowClick}
    />
  );
}
