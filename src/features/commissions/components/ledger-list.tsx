import { requireAuth } from "@/server/auth";
import { getEntries } from "../services/ledger-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { COMMISSION_TYPE_LABELS, LEDGER_STATUS_LABELS } from "../constants";
import type { EntryWithProfile, CommissionFilters } from "../types";

interface LedgerListProps {
  filters?: CommissionFilters;
}

export async function LedgerList({ filters }: LedgerListProps) {
  await requireAuth();
  const entries = await getEntries(filters);

  const columns = [
    {
      key: "profile",
      header: "Sales Profile",
      cell: (item: EntryWithProfile) => (
        <span className="font-medium">
          {item.salesProfile.user.firstName} {item.salesProfile.user.lastName}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (item: EntryWithProfile) => (
        <span className="font-mono text-sm font-medium">${Number(item.amount).toFixed(2)}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (item: EntryWithProfile) => (
        <Badge variant="secondary">{COMMISSION_TYPE_LABELS[item.type] ?? item.type}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: EntryWithProfile) => {
        const variant = item.status === "PAID" ? "default" : item.status === "PENDING" ? "secondary" : item.status === "APPROVED" ? "outline" : "destructive";
        return (
          <Badge variant={variant}>{LEDGER_STATUS_LABELS[item.status] ?? item.status}</Badge>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      cell: (item: EntryWithProfile) => (
        <span className="text-muted-foreground text-sm">{item.description ?? "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (item: EntryWithProfile) => (
        <span className="text-muted-foreground text-sm">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={entries}
      emptyTitle="No commission entries found"
      emptyDescription="Commission entries will appear here once created."
    />
  );
}
