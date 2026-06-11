import { requireAuth } from "@/server/auth";
import { listCustomers } from "../services/customer-service";
import { listGroups } from "@/features/customer-groups/services/group-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { CUSTOMER_TYPE_LABELS } from "../constants";
import { formatCurrency } from "@/lib/utils";
import type { CustomerWithGroup } from "../types";

interface CustomerListProps {
  businessId: string;
}

export async function CustomerList({ businessId }: CustomerListProps) {
  await requireAuth();
  const [customers, groups] = await Promise.all([
    listCustomers(businessId),
    listGroups(businessId),
  ]);

  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

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
        <Badge variant={customer.customerType === "wholesale" ? "default" : "secondary"}>
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

  return (
    <DataTable
      columns={columns}
      data={customers}
      emptyTitle="No customers found"
      emptyDescription="Add your first customer to get started."
    />
  );
}
