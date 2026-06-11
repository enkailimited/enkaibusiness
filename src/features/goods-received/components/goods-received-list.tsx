"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { GoodsReceivedWithRelations } from "../types";

interface GoodsReceivedListProps {
  items: GoodsReceivedWithRelations[];
  isLoading?: boolean;
  onRowClick?: (item: GoodsReceivedWithRelations) => void;
}

export function GoodsReceivedList({ items, isLoading, onRowClick }: GoodsReceivedListProps) {
  const columns = [
    {
      key: "reference",
      header: "Reference",
      cell: (item: GoodsReceivedWithRelations) => (
        <span className="font-medium">{item.reference ?? "—"}</span>
      ),
    },
    {
      key: "purchaseOrder",
      header: "PO Reference",
      cell: (item: GoodsReceivedWithRelations) => (
        <span className="text-sm">{item.purchaseOrder?.reference ?? "—"}</span>
      ),
    },
    {
      key: "receivedDate",
      header: "Received Date",
      cell: (item: GoodsReceivedWithRelations) => (
        <span className="text-sm">{new Date(item.receivedDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (item: GoodsReceivedWithRelations) => (
        <Badge variant="outline">{item.items.length} item{item.items.length !== 1 ? "s" : ""}</Badge>
      ),
    },
    {
      key: "staff",
      header: "Received By",
      cell: (item: GoodsReceivedWithRelations) => (
        <span className="text-sm text-muted-foreground">
          {item.staff ? `${item.staff.firstName} ${item.staff.lastName}` : "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      emptyTitle="No goods received"
      emptyDescription="Goods received records will appear here."
      onRowClick={onRowClick}
    />
  );
}
