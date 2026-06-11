import { getBusinessCategories } from "../services/category-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export async function CategoryList({ businessId }: CategoryListProps) {
  const categories = await getBusinessCategories(businessId);

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
