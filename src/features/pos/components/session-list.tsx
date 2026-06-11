import { requireAuth } from "@/server/auth";
import { getBusinessSessions } from "../services/pos-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { SESSION_STATUS_LABELS, SESSION_STATUS_VARIANTS } from "../constants";
import type { POSSessionWithStaff } from "../types";

interface SessionListProps {
  businessId: string;
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function SessionList({ businessId }: SessionListProps) {
  await requireAuth();
  const sessions = await getBusinessSessions(businessId);

  const columns = [
    {
      key: "store",
      header: "Store",
      cell: (session: POSSessionWithStaff) => (
        <span className="font-medium">{session.store?.name ?? "—"}</span>
      ),
    },
    {
      key: "openedBy",
      header: "Opened By",
      cell: (session: POSSessionWithStaff) => (
        <span>{session.openedBy.firstName} {session.openedBy.lastName}</span>
      ),
    },
    {
      key: "openedAt",
      header: "Opened At",
      cell: (session: POSSessionWithStaff) => (
        <span className="text-muted-foreground">{formatDate(session.openedAt)}</span>
      ),
    },
    {
      key: "closedAt",
      header: "Closed At",
      cell: (session: POSSessionWithStaff) => (
        <span className="text-muted-foreground">{formatDate(session.closedAt)}</span>
      ),
    },
    {
      key: "openingFloat",
      header: "Opening Float",
      cell: (session: POSSessionWithStaff) => (
        <span className="font-mono text-sm">{formatCurrency(session.openingFloat)}</span>
      ),
    },
    {
      key: "closingFloat",
      header: "Closing Float",
      cell: (session: POSSessionWithStaff) => (
        <span className="font-mono text-sm">{formatCurrency(session.closingFloat)}</span>
      ),
    },
    {
      key: "difference",
      header: "Difference",
      cell: (session: POSSessionWithStaff) => {
        const diff = session.difference;
        const className = diff !== null && diff < 0
          ? "font-mono text-sm text-destructive"
          : diff !== null && diff > 0
            ? "font-mono text-sm text-green-600"
            : "font-mono text-sm";
        return <span className={className}>{formatCurrency(diff)}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (session: POSSessionWithStaff) => (
        <Badge variant={SESSION_STATUS_VARIANTS[session.status] ?? "secondary"}>
          {SESSION_STATUS_LABELS[session.status] ?? session.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sessions}
      emptyTitle="No POS sessions found"
      emptyDescription="Open a till session to get started."
    />
  );
}
