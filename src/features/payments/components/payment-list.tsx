"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS } from "../constants";
import type { PaymentWithRelations } from "../types";

const REFERENCE_LABELS: Record<string, string> = {
  saleId: "Sale",
  invoiceId: "Invoice",
  customerCreditTxId: "Credit",
  subscriptionId: "Subscription",
  purchaseId: "Purchase",
  expenseId: "Expense",
};

interface PaymentListProps {
  payments: PaymentWithRelations[];
  isLoading?: boolean;
  onRowClick?: (payment: PaymentWithRelations) => void;
}

export function PaymentList({ payments, isLoading, onRowClick }: PaymentListProps) {
  const statusVariant: Record<string, "success" | "secondary" | "destructive" | "warning"> = {
    completed: "success",
    pending: "secondary",
    failed: "destructive",
    refunded: "warning",
  };

  const columns = [
    {
      key: "paidAt",
      header: "Date",
      cell: (item: PaymentWithRelations) => (
        <span className="text-sm">
          {new Date(item.paidAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (item: PaymentWithRelations) => (
        <span className="font-medium">
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "TZS" }).format(item.amount)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      cell: (item: PaymentWithRelations) => (
        <Badge variant="outline">
          {item.paymentMethod
            ? `${item.paymentMethod.name} (${PAYMENT_METHOD_LABELS[item.paymentMethod.type] ?? item.paymentMethod.type})`
            : "-"}
        </Badge>
      ),
    },
    {
      key: "refType",
      header: "Reference",
      cell: (item: PaymentWithRelations) => {
        const refEntry = Object.entries(REFERENCE_LABELS).find(
          ([key]) => item[key as keyof PaymentWithRelations] !== null,
        );
        return refEntry ? (
          <span className="text-sm">{refEntry[1]}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (item: PaymentWithRelations) => (
        <Badge variant={statusVariant[item.status] ?? "secondary"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments}
      isLoading={isLoading}
      emptyTitle="No payments"
      emptyDescription="Record your first payment to see it here."
      onRowClick={onRowClick}
    />
  );
}
