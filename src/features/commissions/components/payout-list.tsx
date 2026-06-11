import { requireAuth } from "@/server/auth";
import { getPayouts } from "../services/payout-service";
import { DataTable } from "@/components/shared/data-table";
import type { PayoutWithEntries } from "../types";

export async function PayoutList() {
  await requireAuth();
  const payouts = await getPayouts();

  const columns = [
    {
      key: "amount",
      header: "Amount",
      cell: (item: PayoutWithEntries) => (
        <span className="font-mono text-sm font-medium">${Number(item.amount).toFixed(2)}</span>
      ),
    },
    {
      key: "entries",
      header: "Entries",
      cell: (item: PayoutWithEntries) => (
        <span className="text-muted-foreground">{item.entries.length}</span>
      ),
    },
    {
      key: "paidBy",
      header: "Paid By",
      cell: (item: PayoutWithEntries) =>
        item.paidBy ? (
          <span className="text-sm">
            {item.paidBy.firstName} {item.paidBy.lastName}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (item: PayoutWithEntries) => (
        <span className="text-muted-foreground text-sm">{item.notes ?? "—"}</span>
      ),
    },
    {
      key: "paidAt",
      header: "Paid At",
      cell: (item: PayoutWithEntries) => (
        <span className="text-muted-foreground text-sm">
          {new Date(item.paidAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payouts}
      emptyTitle="No payouts found"
      emptyDescription="Process a payout to see it here."
    />
  );
}
