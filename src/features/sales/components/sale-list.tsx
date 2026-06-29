"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listSalesAction } from "../actions";
import { SALE_STATUS_LABELS, SALE_STATUS_VARIANTS } from "../constants";
import { useActiveBranch } from "@/features/branches/context/active-branch-context";
import type { SaleListItem } from "../types";

interface SaleListProps {
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

export function SaleList({ businessId }: SaleListProps) {
  const { activeBranch } = useActiveBranch();
  const query = useQuery({
    queryKey: ["sales", businessId, activeBranch?.id],
    queryFn: async () => {
      const result = await listSalesAction(businessId, activeBranch ? { branchId: activeBranch.id } : undefined);
      return (result ?? []) as SaleListItem[];
    },
  });

  const columns = [
    {
      key: "reference",
      header: "Reference",
      cell: (sale: SaleListItem) => (
        <span className="font-medium">{sale.reference ?? "—"}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (sale: SaleListItem) => {
        const name = sale.customer
          ? `${sale.customer.firstName}${sale.customer.lastName ? ` ${sale.customer.lastName}` : ""}`
          : "Walk-in";
        return <span>{name}</span>;
      },
    },
    {
      key: "saleDate",
      header: "Date",
      cell: (sale: SaleListItem) => (
        <span className="text-muted-foreground">{formatDate(sale.saleDate)}</span>
      ),
    },
    {
      key: "grandTotal",
      header: "Total",
      cell: (sale: SaleListItem) => (
        <span className="font-medium">{formatCurrency(sale.grandTotal)}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (sale: SaleListItem) => (
        <span className="text-muted-foreground">{sale._count.items}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (sale: SaleListItem) => (
        <Badge variant={SALE_STATUS_VARIANTS[sale.status] ?? "secondary"}>
          {SALE_STATUS_LABELS[sale.status] ?? sale.status}
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
      emptyTitle="No sales found"
      emptyDescription="Record your first sale to get started."
    />
  );
}
