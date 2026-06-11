import { getBusinessBrands } from "../services/brand-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BrandListProps {
  businessId: string;
}

export async function BrandList({ businessId }: BrandListProps) {
  const brands = await getBusinessBrands(businessId);

  if (brands.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No brands created yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <Card key={brand.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {brand.logoUrl ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-10 w-10 rounded object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <span className="text-lg font-bold text-muted-foreground">
                    {brand.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{brand.name}</h3>
                  {!brand.isActive && (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                </div>
                {brand.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {brand.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {brand._count.catalogItems} item{brand._count.catalogItems !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
