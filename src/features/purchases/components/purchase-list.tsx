import { requireAuth } from "@/server/auth";
import { getBusinessPurchases } from "../services/purchase-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_VARIANTS } from "../constants";
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

export async function PurchaseList({ businessId }: PurchaseListProps) {
  await requireAuth();
  const purchases = await getBusinessPurchases(businessId);

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

  return (
    <DataTable
      columns={columns}
      data={purchases}
      emptyTitle="No purchases found"
      emptyDescription="Create your first purchase to get started."
    />
  );
}
