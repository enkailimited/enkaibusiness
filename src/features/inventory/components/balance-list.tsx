"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { BalanceWithItem } from "../types";

interface BalanceListProps {
  balances: BalanceWithItem[];
  isLoading?: boolean;
  onRowClick?: (balance: BalanceWithItem) => void;
}

export function BalanceList({ balances, isLoading, onRowClick }: BalanceListProps) {
  const columns = [
    {
      key: "item",
      header: "Item",
      cell: (item: BalanceWithItem) => (
        <div>
          <p className="font-medium">{item.catalogItem.name}</p>
          {item.catalogItem.sku && (
            <p className="text-xs text-muted-foreground">SKU: {item.catalogItem.sku}</p>
          )}
        </div>
      ),
    },
    {
      key: "onHand",
      header: "On Hand",
      cell: (item: BalanceWithItem) => (
        <span className="font-medium">{item.quantityOnHand}</span>
      ),
    },
    {
      key: "available",
      header: "Available",
      cell: (item: BalanceWithItem) => (
        <span>{item.quantityAvailable}</span>
      ),
    },
    {
      key: "committed",
      header: "Committed",
      cell: (item: BalanceWithItem) => (
        <span className="text-muted-foreground">{item.quantityCommitted}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: BalanceWithItem) => {
        if (item.quantityOnHand <= 0) {
          return <Badge variant="destructive">Out of Stock</Badge>;
        }
        if (item.quantityOnHand <= item.reorderPoint) {
          return <Badge variant="warning">Low Stock</Badge>;
        }
        return <Badge variant="success">In Stock</Badge>;
      },
    },
    {
      key: "reorder",
      header: "Reorder At",
      cell: (item: BalanceWithItem) => (
        <span className="text-sm text-muted-foreground">{item.reorderPoint}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={balances}
      isLoading={isLoading}
      emptyTitle="No inventory"
      emptyDescription="Add items to this location to see balances."
      onRowClick={onRowClick}
    />
  );
}
