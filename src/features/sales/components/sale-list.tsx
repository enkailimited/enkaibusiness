import { requireAuth } from "@/server/auth";
import { getBusinessSales } from "../services/sale-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { SALE_STATUS_LABELS, SALE_STATUS_VARIANTS } from "../constants";
import type { SaleListItem } from "../types";

interface SaleListProps {
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

export async function SaleList({ businessId }: SaleListProps) {
  await requireAuth();
  const sales = await getBusinessSales(businessId);

  const columns = [
    {
      key: "reference",
      header: "Reference",
      cell: (sale: SaleListItem) => (
        <span className="font-medium">{sale.reference ?? "—"}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (sale: SaleListItem) => {
        const name = sale.customer
          ? `${sale.customer.firstName}${sale.customer.lastName ? ` ${sale.customer.lastName}` : ""}`
          : "Walk-in";
        return <span>{name}</span>;
      },
    },
    {
      key: "saleDate",
      header: "Date",
      cell: (sale: SaleListItem) => (
        <span className="text-muted-foreground">{formatDate(sale.saleDate)}</span>
      ),
    },
    {
      key: "grandTotal",
      header: "Total",
      cell: (sale: SaleListItem) => (
        <span className="font-medium">{formatCurrency(sale.grandTotal)}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (sale: SaleListItem) => (
        <span className="text-muted-foreground">{sale._count.items}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (sale: SaleListItem) => (
        <Badge variant={SALE_STATUS_VARIANTS[sale.status] ?? "secondary"}>
          {SALE_STATUS_LABELS[sale.status] ?? sale.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sales}
      emptyTitle="No sales found"
      emptyDescription="Record your first sale to get started."
    />
  );
}
