import { requireAuth } from "@/server/auth";
import { getTicket } from "../services/ticket-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, PRIORITY_LABELS } from "../constants";
import { formatDate } from "@/lib/utils";

interface TicketDetailProps {
  id: string;
}

export async function TicketDetail({ id }: TicketDetailProps) {
  await requireAuth();
  const ticket = await getTicket(id);

  if (!ticket) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Ticket not found
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{ticket.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[ticket.status] ?? "default"}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Badge>
            <Badge variant={priorityVariant[ticket.priority] ?? "default"}>
              {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ticket.description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Customer</h4>
            <p className="text-sm">
              {ticket.customer.firstName}
              {ticket.customer.lastName ? ` ${ticket.customer.lastName}` : ""}
            </p>
            {ticket.customer.email && (
              <p className="text-sm text-muted-foreground">{ticket.customer.email}</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Assigned To</h4>
            {ticket.assignedTo ? (
              <>
                <p className="text-sm">
                  {ticket.assignedTo.firstName}
                  {ticket.assignedTo.lastName ? ` ${ticket.assignedTo.lastName}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">{ticket.assignedTo.email}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
          </div>

          {ticket.resolvedAt && (
            <div>
              <h4 className="text-sm font-medium mb-1">Resolved At</h4>
              <p className="text-sm">{formatDate(ticket.resolvedAt)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
