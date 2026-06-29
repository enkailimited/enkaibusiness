"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { MenuItemWithCatalog } from "../types";

interface MenuTableClientProps {
  items: MenuItemWithCatalog[];
}

export function MenuTableClient({ items }: MenuTableClientProps) {
  const columns = [
    {
      key: "catalogItem",
      header: "Item",
      cell: (item: MenuItemWithCatalog) => (
        <div className="flex items-center gap-3">
          {item.catalogItem.imageUrl && (
            <img
              src={item.catalogItem.imageUrl}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          )}
          <span className="font-medium">{item.catalogItem.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (item: MenuItemWithCatalog) => (
        <span className="text-sm text-muted-foreground">{item.catalogItem.type}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (item: MenuItemWithCatalog) => (
        <span className="font-mono text-sm">
          {item.price ? formatCurrency(Number(item.price)) : "—"}
        </span>
      ),
    },
    {
      key: "sortOrder",
      header: "Sort",
      cell: (item: MenuItemWithCatalog) => (
        <span className="text-sm text-muted-foreground">{item.sortOrder}</span>
      ),
    },
    {
      key: "isAvailable",
      header: "Available",
      cell: (item: MenuItemWithCatalog) => (
        <Badge variant={item.isAvailable ? "success" : "secondary"}>
          {item.isAvailable ? "Yes" : "No"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      emptyTitle="No menu items"
      emptyDescription="Add items to this QR menu to get started."
    />
  );
}
