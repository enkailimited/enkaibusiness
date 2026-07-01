"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listPurchasesAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_VARIANTS } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useActiveBranch } from "@/features/branches/context/active-branch-context";
import { recordPurchasePaymentAction } from "@/features/purchases/actions/payable-actions";
import type { PurchaseListItem } from "../types";

interface PurchaseListProps {
  businessId: string;
  workspaceId?: string;
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

export function PurchaseList({ businessId, workspaceId }: PurchaseListProps) {
  const queryClient = useQueryClient();
  const { activeBranch } = useActiveBranch();
  const [payPurchaseId, setPayPurchaseId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const query = useQuery({
    queryKey: ["purchases", businessId, activeBranch?.id],
    queryFn: async () => {
      const result = await listPurchasesAction(businessId, activeBranch ? { branchId: activeBranch.id } : undefined);
      return (result ?? []) as PurchaseListItem[];
    },
  });

  const handlePay = async () => {
    if (!payPurchaseId || !payAmount) return;
    setPaying(true);
    try {
      const formData = new FormData();
      formData.set("purchaseId", payPurchaseId);
      formData.set("amount", payAmount);
      formData.set("businessId", businessId);
      if (workspaceId) formData.set("workspaceId", workspaceId);
      const result = await recordPurchasePaymentAction(null, formData);
      if (result.success) {
        setPayPurchaseId(null);
        setPayAmount("");
        queryClient.invalidateQueries({ queryKey: ["purchases", businessId] });
      }
    } finally {
      setPaying(false);
    }
  };

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
      key: "balanceDue",
      header: "Balance",
      cell: (purchase: PurchaseListItem) => (
        <span className={purchase.balanceDue > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
          {formatCurrency(purchase.balanceDue)}
        </span>
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
    {
      key: "actions",
      header: "",
      cell: (purchase: PurchaseListItem) =>
        purchase.balanceDue > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setPayPurchaseId(purchase.id); setPayAmount(String(purchase.balanceDue)); }}
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
        emptyTitle="No purchases found"
        emptyDescription="Create your first purchase to get started."
      />
      <Dialog open={!!payPurchaseId} onOpenChange={(o) => { if (!o) setPayPurchaseId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter the amount to pay against this purchase</DialogDescription>
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
