"use client";

import { useQuery } from "@tanstack/react-query";
import { listInvoicesAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceWithRelations } from "../types";

interface InvoiceListProps {
  businessId: string;
  branchId?: string;
}

export function InvoiceList({ businessId, branchId }: InvoiceListProps) {
  const query = useQuery({
    queryKey: ["invoices", businessId, branchId],
    queryFn: async () => {
      const result = await listInvoicesAction(businessId, {}, branchId);
      return (result ?? []) as InvoiceWithRelations[];
    },
  });

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      cell: (inv: InvoiceWithRelations) => (
        <span className="font-medium">{inv.invoiceNumber}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (inv: InvoiceWithRelations) => (
        <span>{inv.customer.firstName}{inv.customer.lastName ? ` ${inv.customer.lastName}` : ""}</span>
      ),
    },
    {
      key: "invoiceDate",
      header: "Date",
      cell: (inv: InvoiceWithRelations) => (
        <span className="text-muted-foreground">{formatDate(inv.invoiceDate)}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (inv: InvoiceWithRelations) => (
        <span className="text-muted-foreground">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (inv: InvoiceWithRelations) => (
        <span className="font-mono text-sm">{formatCurrency(inv.total)}</span>
      ),
    },
    {
      key: "paidAmount",
      header: "Paid",
      cell: (inv: InvoiceWithRelations) => (
        <span className="font-mono text-sm">{formatCurrency(inv.paidAmount)}</span>
      ),
    },
    {
      key: "balanceDue",
      header: "Balance",
      cell: (inv: InvoiceWithRelations) => (
        <span className="font-mono text-sm">{formatCurrency(inv.balanceDue)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (inv: InvoiceWithRelations) => (
        <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>
          {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
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
      emptyTitle="No invoices found"
      emptyDescription="Create your first invoice to get started."
    />
  );
}
