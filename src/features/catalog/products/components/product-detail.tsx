import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithRelations } from "../types";

interface ProductDetailProps {
  product: ProductWithRelations;
}

export function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{product.name}</CardTitle>
              {product.sku && (
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>
            <Badge variant={product.isActive ? "success" : "secondary"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Category:</span>{" "}
              {product.category || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Price:</span>{" "}
              <span className="font-medium">{formatCurrency(Number(product.price))}</span>
            </div>
            {product.costPrice && (
              <div>
                <span className="text-muted-foreground">Cost Price:</span>{" "}
                {formatCurrency(Number(product.costPrice))}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Track Stock:</span>{" "}
              {product.trackStock ? "Yes" : "No"}
            </div>
            {product.description && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{product.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {product.variants && product.variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{variant.name}</p>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      {variant.sku && <span>SKU: {variant.sku}</span>}
                      {variant.price && <span>Price: {formatCurrency(Number(variant.price))}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {product.assignments && product.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {product.assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <Badge variant={a.isAvailable ? "success" : "secondary"}>
                    {a.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                  {a.branch && <span>Branch: {a.branch.name}</span>}
                  {a.store && <span>Store: {a.store.name}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
