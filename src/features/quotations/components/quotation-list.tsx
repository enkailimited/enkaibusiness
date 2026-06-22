"use client";

import { useQuery } from "@tanstack/react-query";
import { listQuotationsAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_VARIANTS } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuotationListItem } from "../types";

interface QuotationListProps {
  businessId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function QuotationList({ businessId }: QuotationListProps) {
  const query = useQuery({
    queryKey: ["quotations", businessId],
    queryFn: async () => {
      const result = await listQuotationsAction(businessId);
      return (result ?? []) as QuotationListItem[];
    },
  });

  const columns = [
    {
      key: "customer",
      header: "Customer",
      cell: (quote: QuotationListItem) => {
        const name = quote.customer
          ? `${quote.customer.firstName}${quote.customer.lastName ? ` ${quote.customer.lastName}` : ""}`
          : "—";
        return <span className="font-medium">{name}</span>;
      },
    },
    {
      key: "quoteDate",
      header: "Quote Date",
      cell: (quote: QuotationListItem) => (
        <span className="text-muted-foreground">{formatDate(quote.quoteDate)}</span>
      ),
    },
    {
      key: "expiryDate",
      header: "Expiry",
      cell: (quote: QuotationListItem) => (
        <span className="text-muted-foreground">{formatDate(quote.expiryDate)}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (quote: QuotationListItem) => (
        <span className="font-medium">{formatCurrency(quote.total)}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (quote: QuotationListItem) => (
        <span className="text-muted-foreground">{quote._count.items}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (quote: QuotationListItem) => (
        <Badge variant={QUOTATION_STATUS_VARIANTS[quote.status] ?? "secondary"}>
          {QUOTATION_STATUS_LABELS[quote.status] ?? quote.status}
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
      emptyTitle="No quotations found"
      emptyDescription="Create your first quotation to get started."
    />
  );
}
