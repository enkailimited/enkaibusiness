"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUS_VARIANTS } from "../constants";
import type { PurchaseOrderListItem } from "../types";

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

interface Props {
  orders: PurchaseOrderListItem[];
}

export function PurchaseOrderTableClient({ orders }: Props) {
  const columns = [
    {
      key: "supplier",
      header: "Supplier",
      cell: (order: PurchaseOrderListItem) => (
        <span className="font-medium">{order.supplier.name}</span>
      ),
    },
    {
      key: "orderDate",
      header: "Order Date",
      cell: (order: PurchaseOrderListItem) => (
        <span className="text-muted-foreground">{formatDate(order.orderDate)}</span>
      ),
    },
    {
      key: "expectedDate",
      header: "Expected",
      cell: (order: PurchaseOrderListItem) => (
        <span className="text-muted-foreground">
          {order.expectedDate ? formatDate(order.expectedDate) : "—"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (order: PurchaseOrderListItem) => (
        <span className="font-medium">{formatCurrency(order.total)}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (order: PurchaseOrderListItem) => (
        <span className="text-muted-foreground">{order._count.items}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (order: PurchaseOrderListItem) => (
        <Badge variant={PURCHASE_ORDER_STATUS_VARIANTS[order.status] ?? "secondary"}>
          {PURCHASE_ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      emptyTitle="No purchase orders found"
      emptyDescription="Create your first purchase order to get started."
    />
  );
}
