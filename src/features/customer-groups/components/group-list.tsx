import { requireAuth } from "@/server/auth";
import { listGroups } from "../services/group-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { CustomerGroupWithCount } from "../types";

interface GroupListProps {
  businessId: string;
}

export async function GroupList({ businessId }: GroupListProps) {
  await requireAuth();
  const groups = await listGroups(businessId);

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (group: CustomerGroupWithCount) => (
        <span className="font-medium">
          {group.name}
          {group.isDefault && (
            <Badge variant="secondary" className="ml-2">Default</Badge>
          )}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (group: CustomerGroupWithCount) => (
        <span className="text-muted-foreground">{group.description ?? "—"}</span>
      ),
    },
    {
      key: "discountPercent",
      header: "Discount",
      cell: (group: CustomerGroupWithCount) => (
        <span className="font-mono">{group.discountPercent}%</span>
      ),
    },
    {
      key: "customers",
      header: "Customers",
      cell: (group: CustomerGroupWithCount) => (
        <span className="font-mono">{group._count.customers}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={groups}
      emptyTitle="No customer groups"
      emptyDescription="Create your first customer group to organize customers."
    />
  );
}
