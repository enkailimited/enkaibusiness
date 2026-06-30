"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { listInvoicesAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { INVOICE_STATUS_LABELS } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { recordInvoicePaymentAction } from "@/features/invoices/actions/receivable-actions";
import type { InvoiceWithRelations } from "../types";

interface InvoiceListProps {
  businessId: string;
  branchId?: string;
}

export function InvoiceList({ businessId, branchId }: InvoiceListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const query = useQuery({
    queryKey: ["invoices", businessId, branchId],
    queryFn: async () => {
      const result = await listInvoicesAction(businessId, {}, branchId);
      return (result ?? []) as InvoiceWithRelations[];
    },
  });

  const handlePay = async () => {
    if (!payInvoiceId || !payAmount) return;
    setPaying(true);
    try {
      const formData = new FormData();
      formData.set("invoiceId", payInvoiceId);
      formData.set("amount", payAmount);
      formData.set("businessId", businessId);
      const result = await recordInvoicePaymentAction(null, formData);
      if (result.success) {
        setPayInvoiceId(null);
        setPayAmount("");
        queryClient.invalidateQueries({ queryKey: ["invoices", businessId] });
      }
    } finally {
      setPaying(false);
    }
  };

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
        <span className={inv.balanceDue > 0 ? "text-red-600 font-mono text-sm font-medium" : "font-mono text-sm"}>
          {formatCurrency(inv.balanceDue)}
        </span>
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
    {
      key: "actions",
      header: "",
      cell: (inv: InvoiceWithRelations) =>
        inv.balanceDue > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); setPayInvoiceId(inv.id); setPayAmount(String(inv.balanceDue)); }}
          >
            Pay
          </Button>
        ) : null,
    },
  ];

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={query.data ?? []}
        emptyTitle="No invoices found"
        emptyDescription="Create your first invoice to get started."
        onRowClick={(inv) => router.push(`/workspaces/businesses/${businessId}/commerce/invoices/${inv.id}`)}
      />
      <Dialog open={!!payInvoiceId} onOpenChange={(o) => { if (!o) setPayInvoiceId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter the amount to record against this invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="number"
              min="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-lg font-semibold outline-none focus:border-blue-300"
              placeholder="Amount"
              autoFocus
            />
            <Button onClick={handlePay} disabled={paying || !payAmount} className="w-full">
              {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
