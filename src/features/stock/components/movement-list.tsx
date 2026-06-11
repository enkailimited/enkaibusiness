"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { REFERENCE_TYPE_LABELS } from "../constants";
import type { MovementWithDetails } from "../types";

interface MovementListProps {
  movements: MovementWithDetails[];
  isLoading?: boolean;
  onRowClick?: (movement: MovementWithDetails) => void;
}

export function MovementList({ movements, isLoading, onRowClick }: MovementListProps) {
  const columns = [
    {
      key: "date",
      header: "Date",
      cell: (item: MovementWithDetails) => (
        <span className="text-sm">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "item",
      header: "Item",
      cell: (item: MovementWithDetails) => (
        <div>
          <p className="font-medium">{item.catalogItem.name}</p>
          {item.catalogItem.sku && (
            <p className="text-xs text-muted-foreground">{item.catalogItem.sku}</p>
          )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (item: MovementWithDetails) => (
        <span className="text-sm">{item.location.name}</span>
      ),
    },
    {
      key: "change",
      header: "Change",
      cell: (item: MovementWithDetails) => {
        const isPositive = item.quantityChange >= 0;
        return (
          <span className={isPositive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {isPositive ? "+" : ""}{item.quantityChange}
          </span>
        );
      },
    },
    {
      key: "balance",
      header: "Balance",
      cell: (item: MovementWithDetails) => (
        <span className="text-sm text-muted-foreground">
          {item.balanceBefore} → {item.balanceAfter}
        </span>
      ),
    },
    {
      key: "refType",
      header: "Type",
      cell: (item: MovementWithDetails) => (
        <Badge variant="outline">
          {REFERENCE_TYPE_LABELS[item.referenceType] ?? item.referenceType}
        </Badge>
      ),
    },
    {
      key: "ref",
      header: "Reference",
      cell: (item: MovementWithDetails) => (
        <span className="text-xs text-muted-foreground font-mono">
          {item.reference ? item.reference.substring(0, 8) + "..." : "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={movements}
      isLoading={isLoading}
      emptyTitle="No stock movements"
      emptyDescription="Stock movements will appear here as inventory changes."
      onRowClick={onRowClick}
    />
  );
}
