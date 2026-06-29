"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Pencil, MailX } from "lucide-react";
import type { StaffWithUser, StaffAssignmentWithDetails } from "../types";

interface StaffListProps {
  staff: (StaffWithUser & { assignments?: StaffAssignmentWithDetails[] })[];
  isLoading?: boolean;
  onRowClick?: (staff: StaffWithUser) => void;
  onEdit?: (staff: StaffWithUser) => void;
  onReinvite?: (staff: StaffWithUser) => void;
}

export function StaffList({ staff, isLoading, onRowClick, onEdit, onReinvite }: StaffListProps) {
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
      key: "role",
      header: "Role",
      cell: (item: StaffWithUser & { assignments?: StaffAssignmentWithDetails[] }) => {
        const role = item.assignments?.find((a) => a.role)?.role;
        return <span className="text-sm">{role?.name || "-"}</span>;
      },
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
    {
      key: "actions",
      header: "",
      cell: (item: StaffWithUser) => (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onReinvite && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReinvite(item)} title="Re-invite">
              <MailX className="h-4 w-4" />
            </Button>
          )}
        </div>
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
