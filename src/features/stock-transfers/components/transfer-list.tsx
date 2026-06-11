"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { TRANSFER_STATUS_LABELS, TRANSFER_STATUS_VARIANTS } from "../constants";
import type { TransferWithRelations } from "../types";

interface TransferListProps {
  items: TransferWithRelations[];
  isLoading?: boolean;
  onRowClick?: (item: TransferWithRelations) => void;
}

export function TransferList({ items, isLoading, onRowClick }: TransferListProps) {
  const columns = [
    {
      key: "route",
      header: "From → To",
      cell: (item: TransferWithRelations) => (
        <div>
          <span className="font-medium">{item.fromLocation?.name ?? "—"}</span>
          <span className="text-muted-foreground mx-1">→</span>
          <span className="font-medium">{item.toLocation?.name ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "transferDate",
      header: "Date",
      cell: (item: TransferWithRelations) => (
        <span className="text-sm">{new Date(item.transferDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: TransferWithRelations) => (
        <Badge variant={TRANSFER_STATUS_VARIANTS[item.status] ?? "secondary"}>
          {TRANSFER_STATUS_LABELS[item.status] ?? item.status}
        </Badge>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (item: TransferWithRelations) => (
        <Badge variant="outline">{item.items.length} item{item.items.length !== 1 ? "s" : ""}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      emptyTitle="No stock transfers"
      emptyDescription="Stock transfers will appear here."
      onRowClick={onRowClick}
    />
  );
}
