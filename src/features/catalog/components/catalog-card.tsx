import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ITEM_TYPE_LABELS, ITEM_TYPE_VARIANTS } from "../constants";
import type { CatalogItemWithRelations } from "../types";

interface CatalogCardProps {
  item: CatalogItemWithRelations;
}

export function CatalogCard({ item }: CatalogCardProps) {
  return (
    <Card className="overflow-hidden">
      {item.imageUrl && (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-none">{item.name}</h3>
          <Badge variant={ITEM_TYPE_VARIANTS[item.itemType] ?? "default"}>
            {ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-1 text-sm">
          {item.sku && (
            <p className="text-muted-foreground">SKU: {item.sku}</p>
          )}
          <p className="text-lg font-bold">
            {new Intl.NumberFormat("en-TZ", {
              style: "currency",
              currency: item.currency,
            }).format(item.price)}
          </p>
          <div className="flex flex-wrap gap-1">
            {item.category && (
              <Badge variant="outline" className="text-xs">
                {item.category.name}
              </Badge>
            )}
            {item.brand && (
              <Badge variant="outline" className="text-xs">
                {item.brand.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-3">
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <span>{item.isActive ? "Active" : "Inactive"}</span>
          {item.unit && <span>{item.unit.name}</span>}
        </div>
      </CardFooter>
    </Card>
  );
}
