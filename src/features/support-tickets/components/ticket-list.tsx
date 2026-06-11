import { requireAuth } from "@/server/auth";
import { listTickets } from "../services/ticket-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, PRIORITY_LABELS } from "../constants";
import { formatDate } from "@/lib/utils";
import type { TicketWithRelations } from "../types";

interface TicketListProps {
  businessId?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  customerId?: string;
  search?: string;
  page?: number;
}

export async function TicketList({
  businessId,
  status,
  priority,
  assignedToId,
  customerId,
  search,
  page = 1,
}: TicketListProps) {
  await requireAuth();

  const { data: tickets } = await listTickets({
    businessId,
    status,
    priority,
    assignedToId,
    customerId,
    search,
    page,
    limit: 20,
  });

  const priorityVariant: Record<string, "default" | "destructive" | "secondary" | "outline" | "success" | "warning"> = {
    LOW: "secondary",
    MEDIUM: "default",
    HIGH: "warning",
    URGENT: "destructive",
  };

  const statusVariant: Record<string, "default" | "destructive" | "secondary" | "outline" | "success" | "warning"> = {
    OPEN: "default",
    IN_PROGRESS: "warning",
    RESOLVED: "success",
    CLOSED: "secondary",
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      cell: (ticket: TicketWithRelations) => (
        <span className="font-medium">{ticket.title}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (ticket: TicketWithRelations) => (
        <span>
          {ticket.customer.firstName}
          {ticket.customer.lastName ? ` ${ticket.customer.lastName}` : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (ticket: TicketWithRelations) => (
        <Badge variant={statusVariant[ticket.status] ?? "default"}>
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (ticket: TicketWithRelations) => (
        <Badge variant={priorityVariant[ticket.priority] ?? "default"}>
          {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
        </Badge>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      cell: (ticket: TicketWithRelations) => (
        <span>
          {ticket.assignedTo
            ? `${ticket.assignedTo.firstName}${ticket.assignedTo.lastName ? ` ${ticket.assignedTo.lastName}` : ""}`
            : "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (ticket: TicketWithRelations) => (
        <span className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tickets}
      emptyTitle="No tickets found"
      emptyDescription="No support tickets match your criteria."
    />
  );
}
