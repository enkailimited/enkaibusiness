"use client";

import { useQuery } from "@tanstack/react-query";
import { listPurchasesAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_VARIANTS } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { PurchaseListItem } from "../types";

interface PurchaseListProps {
  businessId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PurchaseList({ businessId }: PurchaseListProps) {
  const query = useQuery({
    queryKey: ["purchases", businessId],
    queryFn: async () => {
      const result = await listPurchasesAction(businessId);
      return (result ?? []) as PurchaseListItem[];
    },
  });

  const columns = [
    {
      key: "reference",
      header: "Reference",
      cell: (purchase: PurchaseListItem) => (
        <span className="font-medium">{purchase.reference ?? "—"}</span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      cell: (purchase: PurchaseListItem) => (
        <span>{purchase.supplier.name}</span>
      ),
    },
    {
      key: "purchaseDate",
      header: "Date",
      cell: (purchase: PurchaseListItem) => (
        <span className="text-muted-foreground">{formatDate(purchase.purchaseDate)}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (purchase: PurchaseListItem) => (
        <span className="font-medium">{formatCurrency(purchase.total)}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (purchase: PurchaseListItem) => (
        <span className="text-muted-foreground">{purchase._count.items}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (purchase: PurchaseListItem) => (
        <Badge variant={PURCHASE_STATUS_VARIANTS[purchase.status] ?? "secondary"}>
          {PURCHASE_STATUS_LABELS[purchase.status] ?? purchase.status}
        </Badge>
      ),
    },
  ];

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <DataTable
      columns={columns}
      data={query.data ?? []}
      emptyTitle="No purchases found"
      emptyDescription="Create your first purchase to get started."
    />
  );
}
