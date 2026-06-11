"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { PRICE_LIST_TYPE_LABELS, PRICE_LIST_TYPE_VARIANTS } from "../constants";
import type { PriceListWithItems } from "../types";

interface PriceListListProps {
  priceLists: PriceListWithItems[];
  isLoading?: boolean;
  onRowClick?: (list: PriceListWithItems) => void;
}

export function PriceListList({ priceLists, isLoading, onRowClick }: PriceListListProps) {
  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (item: PriceListWithItems) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.items?.length ?? 0} items</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (item: PriceListWithItems) => (
        <Badge variant={PRICE_LIST_TYPE_VARIANTS[item.type] ?? "outline"}>
          {PRICE_LIST_TYPE_LABELS[item.type] ?? item.type}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (item: PriceListWithItems) => (
        <span className="text-sm">{item.priority}</span>
      ),
    },
    {
      key: "dates",
      header: "Active Period",
      cell: (item: PriceListWithItems) => (
        <span className="text-sm text-muted-foreground">
          {item.startDate ? formatDate(item.startDate) : "Always"}
          {item.endDate ? ` - ${formatDate(item.endDate)}` : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: PriceListWithItems) => {
        const now = new Date();
        const isExpired = item.endDate && new Date(item.endDate) < now;
        const isPending = item.startDate && new Date(item.startDate) > now;
        const isActive = item.isActive && !isExpired && !isPending;

        return (
          <Badge variant={isActive ? "success" : isExpired ? "destructive" : "secondary"}>
            {isExpired ? "Expired" : isPending ? "Scheduled" : item.isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={priceLists}
      isLoading={isLoading}
      emptyTitle="No price lists found"
      emptyDescription="Create a price list to set custom pricing."
      onRowClick={onRowClick}
    />
  );
}
