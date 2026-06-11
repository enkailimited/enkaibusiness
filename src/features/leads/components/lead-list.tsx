import { requireAuth } from "@/server/auth";
import { getLeads } from "../services/lead-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "../constants";
import type { LeadWithAssignments, LeadFilters } from "../types";

interface LeadListProps {
  filters?: LeadFilters;
  onRowClick?: (lead: LeadWithAssignments) => void;
}

export async function LeadList({ filters, onRowClick }: LeadListProps) {
  await requireAuth();
  const leads = await getLeads(filters);

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (item: LeadWithAssignments) => (
        <span className="font-medium">
          {item.firstName} {item.lastName}
        </span>
      ),
    },
    {
      key: "businessName",
      header: "Business",
      cell: (item: LeadWithAssignments) => (
        <span className="text-muted-foreground">{item.businessName ?? "—"}</span>
      ),
    },
    {
      key: "source",
      header: "Source",
      cell: (item: LeadWithAssignments) => (
        <Badge variant="secondary">{LEAD_SOURCE_LABELS[item.source] ?? item.source}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: LeadWithAssignments) => {
        const variant = item.status === "CONVERTED" ? "default" : item.status === "LOST" ? "destructive" : "secondary";
        return (
          <Badge variant={variant}>{LEAD_STATUS_LABELS[item.status] ?? item.status}</Badge>
        );
      },
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      cell: (item: LeadWithAssignments) =>
        item.assignedTo ? (
          <span className="text-sm">
            {item.assignedTo.user.firstName} {item.assignedTo.user.lastName}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (item: LeadWithAssignments) => (
        <span className="text-muted-foreground text-sm">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={leads}
      emptyTitle="No leads found"
      emptyDescription="Create your first lead to get started."
      onRowClick={onRowClick}
    />
  );
}
