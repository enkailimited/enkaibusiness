import { requireAuth } from "@/server/auth";
import { listCategories } from "../services/category-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { ExpenseCategoryWithCount } from "../types";

interface CategoryListProps {
  businessId: string;
}

export async function CategoryList({ businessId }: CategoryListProps) {
  await requireAuth();
  const categories = await listCategories(businessId);

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (cat: ExpenseCategoryWithCount) => (
        <span className="font-medium">{cat.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (cat: ExpenseCategoryWithCount) => (
        <span className="text-muted-foreground">{cat.description ?? "—"}</span>
      ),
    },
    {
      key: "expenses",
      header: "Expenses",
      cell: (cat: ExpenseCategoryWithCount) => (
        <span className="font-mono text-sm">{cat._count.expenses}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (cat: ExpenseCategoryWithCount) => (
        <Badge variant={cat.isActive ? "default" : "secondary"}>
          {cat.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories}
      emptyTitle="No expense categories found"
      emptyDescription="Create your first expense category to get started."
    />
  );
}
