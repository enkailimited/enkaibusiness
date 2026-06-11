"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { ADJUSTMENT_STATUS_LABELS } from "../constants";
import type { AdjustmentWithRelations } from "../types";

interface AdjustmentListProps {
  items: AdjustmentWithRelations[];
  isLoading?: boolean;
  onRowClick?: (item: AdjustmentWithRelations) => void;
}

export function AdjustmentList({ items, isLoading, onRowClick }: AdjustmentListProps) {
  const columns = [
    {
      key: "reason",
      header: "Reason",
      cell: (item: AdjustmentWithRelations) => (
        <span className="font-medium">{item.reason}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (item: AdjustmentWithRelations) => (
        <span className="text-sm">{item.location?.name ?? "—"}</span>
      ),
    },
    {
      key: "adjustmentDate",
      header: "Date",
      cell: (item: AdjustmentWithRelations) => (
        <span className="text-sm">{new Date(item.adjustmentDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: AdjustmentWithRelations) => (
        <Badge variant={item.status === "approved" ? "success" : "secondary"}>
          {ADJUSTMENT_STATUS_LABELS[item.status] ?? item.status}
        </Badge>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (item: AdjustmentWithRelations) => (
        <Badge variant="outline">{item.items.length} item{item.items.length !== 1 ? "s" : ""}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      emptyTitle="No stock adjustments"
      emptyDescription="Stock adjustments will appear here."
      onRowClick={onRowClick}
    />
  );
}
