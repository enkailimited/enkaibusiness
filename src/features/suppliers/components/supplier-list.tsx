"use client";

import { useQuery } from "@tanstack/react-query";
import { listSuppliersAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { SUPPLIER_TYPE_LABELS } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupplierWithCount } from "../types";

interface SupplierListProps {
  businessId: string;
}

export function SupplierList({ businessId }: SupplierListProps) {
  const query = useQuery({
    queryKey: ["suppliers", businessId],
    queryFn: async () => {
      const result = await listSuppliersAction(businessId);
      return (result ?? []) as SupplierWithCount[];
    },
  });

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (supplier: SupplierWithCount) => (
        <span className="font-medium">{supplier.name}</span>
      ),
    },
    {
      key: "supplierType",
      header: "Type",
      cell: (supplier: SupplierWithCount) => (
        <Badge variant={supplier.supplierType === "international" ? "default" : "secondary"}>
          {SUPPLIER_TYPE_LABELS[supplier.supplierType] ?? supplier.supplierType}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (supplier: SupplierWithCount) => (
        <span className="text-muted-foreground">{supplier.phone ?? "—"}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (supplier: SupplierWithCount) => (
        <span className="text-muted-foreground">{supplier.email ?? "—"}</span>
      ),
    },
    {
      key: "country",
      header: "Country",
      cell: (supplier: SupplierWithCount) => (
        <span>{supplier.country}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (supplier: SupplierWithCount) => (
        <Badge variant={supplier.isActive ? "success" : "secondary"}>
          {supplier.isActive ? "Active" : "Inactive"}
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
      emptyTitle="No suppliers found"
      emptyDescription="Add your first supplier to get started."
    />
  );
}
