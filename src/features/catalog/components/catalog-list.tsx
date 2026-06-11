import { getBusinessCatalog } from "../services/catalog-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ITEM_TYPE_LABELS, ITEM_TYPE_VARIANTS } from "../constants";
import type { CatalogItemWithRelations } from "../types";

interface CatalogListProps {
  businessId: string;
  search?: string;
  itemType?: string;
}

export async function CatalogList({ businessId, search, itemType }: CatalogListProps) {
  const { items } = await getBusinessCatalog(businessId, { search, itemType });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog Items</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<CatalogItemWithRelations>
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (r) => (
                <div>
                  <span className="font-medium">{r.name}</span>
                  {r.sku && (
                    <span className="ml-2 text-xs text-muted-foreground">SKU: {r.sku}</span>
                  )}
                </div>
              ),
            },
            {
              key: "itemType",
              header: "Type",
              cell: (r) => (
                <Badge variant={ITEM_TYPE_VARIANTS[r.itemType] ?? "default"}>
                  {ITEM_TYPE_LABELS[r.itemType] ?? r.itemType}
                </Badge>
              ),
            },
            {
              key: "price",
              header: "Price",
              cell: (r) => (
                <span>
                  {new Intl.NumberFormat("en-TZ", {
                    style: "currency",
                    currency: r.currency,
                  }).format(r.price)}
                </span>
              ),
            },
            {
              key: "category",
              header: "Category",
              cell: (r) => r.category?.name ?? "—",
            },
            {
              key: "isActive",
              header: "Status",
              cell: (r) => (
                <Badge variant={r.isActive ? "default" : "secondary"}>
                  {r.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
          ]}
          data={items}
          emptyTitle="No catalog items"
          emptyDescription="Add your first catalog item to get started"
        />
      </CardContent>
    </Card>
  );
}
