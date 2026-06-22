"use client";

import { useQuery } from "@tanstack/react-query";
import { listCustomersAction } from "../actions";
import { listGroupsAction } from "@/features/customer-groups/actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { CUSTOMER_TYPE_LABELS } from "../constants";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerWithGroup } from "../types";

interface CustomerListProps {
  businessId: string;
}

export function CustomerList({ businessId }: CustomerListProps) {
  const customersQuery = useQuery({
    queryKey: ["customers", businessId],
    queryFn: async () => {
      const result = await listCustomersAction(businessId);
      return (result ?? []) as CustomerWithGroup[];
    },
  });

  const groupsQuery = useQuery({
    queryKey: ["customer-groups", businessId],
    queryFn: async () => {
      const result = await listGroupsAction(businessId);
      return result ?? [];
    },
  });

  const groupMap = new Map((groupsQuery.data ?? []).map((g: { id: string; name: string }) => [g.id, g.name]));

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (customer: CustomerWithGroup) => (
        <span className="font-medium">
          {customer.firstName}{customer.lastName ? ` ${customer.lastName}` : ""}
        </span>
      ),
    },
    {
      key: "customerType",
      header: "Type",
      cell: (customer: CustomerWithGroup) => (
        <Badge variant={customer.customerType === "WHOLESALE" ? "default" : "secondary"}>
          {CUSTOMER_TYPE_LABELS[customer.customerType] ?? customer.customerType}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (customer: CustomerWithGroup) => (
        <span className="text-muted-foreground">{customer.phone ?? "—"}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (customer: CustomerWithGroup) => (
        <span className="text-muted-foreground">{customer.email ?? "—"}</span>
      ),
    },
    {
      key: "customerGroup",
      header: "Group",
      cell: (customer: CustomerWithGroup) => {
        const groupName = customer.customerGroupId ? groupMap.get(customer.customerGroupId) : null;
        return groupName ? (
          <Badge variant="outline">{groupName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "creditLimit",
      header: "Credit Limit",
      cell: (customer: CustomerWithGroup) => (
        <span className="font-mono text-sm">{formatCurrency(customer.creditLimit)}</span>
      ),
    },
  ];

  if (customersQuery.isPending || groupsQuery.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <DataTable
      columns={columns}
      data={customersQuery.data ?? []}
      emptyTitle="No customers found"
      emptyDescription="Add your first customer to get started."
    />
  );
}
