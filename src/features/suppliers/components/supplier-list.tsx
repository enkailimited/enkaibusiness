import { requireAuth } from "@/server/auth";
import { listSuppliers } from "../services/supplier-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { SUPPLIER_TYPE_LABELS } from "../constants";
import type { SupplierWithCount } from "../types";

interface SupplierListProps {
  businessId: string;
}

export async function SupplierList({ businessId }: SupplierListProps) {
  await requireAuth();
  const suppliers = await listSuppliers(businessId);

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

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      emptyTitle="No suppliers found"
      emptyDescription="Add your first supplier to get started."
    />
  );
}
