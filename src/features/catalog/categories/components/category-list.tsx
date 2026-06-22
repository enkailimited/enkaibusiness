"use client";

import { useQuery } from "@tanstack/react-query";
import { listCategoriesAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryWithChildren } from "../types";

interface CategoryListProps {
  businessId: string;
}

function CategoryTreeItem({
  category,
  depth = 0,
}: {
  category: CategoryWithChildren;
  depth?: number;
}) {
  return (
    <>
      <tr className="border-b transition-colors hover:bg-muted/50">
        <td className="px-4 py-3 text-sm" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {depth > 0 && (
              <span className="text-xs text-muted-foreground">└─</span>
            )}
            <span className={depth > 0 ? "text-sm" : "font-medium"}>
              {category.name}
            </span>
            {!category.isActive && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {category._count?.catalogItems ?? 0} items
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {category.sortOrder}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {category.description ?? "—"}
        </td>
      </tr>
      {category.children.map((child) => (
        <CategoryTreeItem key={child.id} category={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function CategoryList({ businessId }: CategoryListProps) {
  const query = useQuery({
    queryKey: ["categories", businessId],
    queryFn: async () => {
      const result = await listCategoriesAction(businessId);
      return (result ?? []) as CategoryWithChildren[];
    },
  });

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const categories = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sort Order</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <CategoryTreeItem key={cat.id} category={cat} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
