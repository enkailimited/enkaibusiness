import { requireAuth } from "@/server/auth";
import { listReturns } from "../services/return-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { RETURN_STATUS_LABELS } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReturnWithRelations } from "../types";

interface ReturnListProps {
  businessId: string;
}

export async function ReturnList({ businessId }: ReturnListProps) {
  await requireAuth();
  const returns = await listReturns(businessId);

  const columns = [
    {
      key: "reference",
      header: "Reference",
      cell: (ret: ReturnWithRelations) => (
        <span className="font-medium">{ret.reference ?? "—"}</span>
      ),
    },
    {
      key: "sale",
      header: "Sale Ref",
      cell: (ret: ReturnWithRelations) => (
        <span className="text-muted-foreground">{ret.sale.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: "returnDate",
      header: "Date",
      cell: (ret: ReturnWithRelations) => (
        <span className="text-muted-foreground">{formatDate(ret.returnDate)}</span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (ret: ReturnWithRelations) => (
        <span className="max-w-[200px] truncate">{ret.reason}</span>
      ),
    },
    {
      key: "refundAmount",
      header: "Refund Amount",
      cell: (ret: ReturnWithRelations) => (
        <span className="font-mono text-sm">{formatCurrency(ret.refundAmount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (ret: ReturnWithRelations) => (
        <Badge variant={ret.status === "approved" ? "default" : ret.status === "rejected" ? "destructive" : "secondary"}>
          {RETURN_STATUS_LABELS[ret.status] ?? ret.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={returns}
      emptyTitle="No returns found"
      emptyDescription="Process your first return to get started."
    />
  );
}
