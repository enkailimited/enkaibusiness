"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithVariants } from "../types";

interface ProductListProps {
  products: ProductWithVariants[];
  isLoading?: boolean;
  onRowClick?: (product: ProductWithVariants) => void;
}

export function ProductList({ products, isLoading, onRowClick }: ProductListProps) {
  const columns = [
    {
      key: "name",
      header: "Product",
      cell: (item: ProductWithVariants) => (
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              No img
            </div>
          )}
          <div>
            <p className="font-medium">{item.name}</p>
            {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: ProductWithVariants) => (
        <span className="text-sm">{item.category || "-"}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (item: ProductWithVariants) => (
        <span className="text-sm font-medium">{formatCurrency(Number(item.price))}</span>
      ),
    },
    {
      key: "variants",
      header: "Variants",
      cell: (item: ProductWithVariants) => (
        <span className="text-sm text-muted-foreground">{item.variants?.length || 0}</span>
      ),
    },
    {
      key: "trackStock",
      header: "Stock",
      cell: (item: ProductWithVariants) => (
        <span className="text-sm">{item.trackStock ? "Tracked" : "Not tracked"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: ProductWithVariants) => (
        <Badge variant={item.isActive ? "success" : "secondary"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      isLoading={isLoading}
      emptyTitle="No products found"
      emptyDescription="Add your first product to get started."
      onRowClick={onRowClick}
    />
  );
}
