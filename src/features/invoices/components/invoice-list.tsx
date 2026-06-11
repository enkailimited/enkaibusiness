import { requireAuth } from "@/server/auth";
import { listInvoices } from "../services/invoice-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceWithRelations } from "../types";

interface InvoiceListProps {
  businessId: string;
  branchId?: string;
}

export async function InvoiceList({ businessId, branchId }: InvoiceListProps) {
  await requireAuth();
  const invoices = await listInvoices(businessId, {}, branchId);

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

  return (
    <DataTable
      columns={columns}
      data={invoices}
      emptyTitle="No invoices found"
      emptyDescription="Create your first invoice to get started."
    />
  );
}
