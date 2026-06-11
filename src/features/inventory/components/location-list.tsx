"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { LOCATION_TYPE_LABELS } from "../constants";
import type { LocationWithBalances } from "../types";

interface LocationListProps {
  locations: LocationWithBalances[];
  isLoading?: boolean;
  onRowClick?: (location: LocationWithBalances) => void;
}

export function LocationList({ locations, isLoading, onRowClick }: LocationListProps) {
  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (item: LocationWithBalances) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (item: LocationWithBalances) => (
        <Badge variant="outline">
          {LOCATION_TYPE_LABELS[item.type] ?? item.type}
        </Badge>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      cell: (item: LocationWithBalances) => (
        <span className="text-sm text-muted-foreground">
          {item.branch?.name ?? "-"}
        </span>
      ),
    },
    {
      key: "store",
      header: "Store",
      cell: (item: LocationWithBalances) => (
        <span className="text-sm text-muted-foreground">
          {item.store?.name ?? "-"}
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (item: LocationWithBalances) => (
        <span className="text-sm">
          {item._count?.balances ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: LocationWithBalances) => (
        <Badge variant={item.isActive ? "success" : "secondary"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={locations}
      isLoading={isLoading}
      emptyTitle="No inventory locations"
      emptyDescription="Create a location to start managing inventory."
      onRowClick={onRowClick}
    />
  );
}
