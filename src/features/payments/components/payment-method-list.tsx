"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS } from "../constants";
import type { PaymentMethodWithCount } from "../types";

interface PaymentMethodListProps {
  methods: PaymentMethodWithCount[];
  isLoading?: boolean;
  onRowClick?: (method: PaymentMethodWithCount) => void;
}

export function PaymentMethodList({ methods, isLoading, onRowClick }: PaymentMethodListProps) {
  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (item: PaymentMethodWithCount) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (item: PaymentMethodWithCount) => (
        <Badge variant="outline">
          {PAYMENT_METHOD_LABELS[item.type] ?? item.type}
        </Badge>
      ),
    },
    {
      key: "usage",
      header: "Payments",
      cell: (item: PaymentMethodWithCount) => (
        <span className="text-sm text-muted-foreground">
          {item._count?.payments ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: PaymentMethodWithCount) => (
        <Badge variant={item.isActive ? "success" : "secondary"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={methods}
      isLoading={isLoading}
      emptyTitle="No payment methods"
      emptyDescription="Add a payment method to start recording payments."
      onRowClick={onRowClick}
    />
  );
}
