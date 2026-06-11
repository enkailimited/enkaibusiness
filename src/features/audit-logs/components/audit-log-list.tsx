import { requireAuth } from "@/server/auth";
import { getAuditLogs } from "../services/audit-service";
import { DataTable } from "@/components/shared/data-table";
import { formatDate } from "@/lib/utils";
import type { AuditLogWithUser } from "../types";

interface AuditLogListProps {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  page?: number;
}

export async function AuditLogList({
  userId,
  action,
  resourceType,
  resourceId,
  page = 1,
}: AuditLogListProps) {
  await requireAuth();

  const { data: logs } = await getAuditLogs({
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
      cell: (log: AuditLogWithUser) => (
        <span className="font-medium">
          {log.user.firstName}
          {log.user.lastName ? ` ${log.user.lastName}` : ""}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (log: AuditLogWithUser) => (
        <span className="capitalize">{log.action}</span>
      ),
    },
    {
      key: "resourceType",
      header: "Resource Type",
      cell: (log: AuditLogWithUser) => (
        <span className="text-sm capitalize">{log.resourceType}</span>
      ),
    },
    {
      key: "resourceId",
      header: "Resource",
      cell: (log: AuditLogWithUser) => (
        <span className="font-mono text-xs">{log.resourceId.slice(0, 8)}...</span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (log: AuditLogWithUser) => (
        <span className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={logs}
      emptyTitle="No audit logs found"
      emptyDescription="No audit records match your criteria."
    />
  );
}
