import { notFound } from "next/navigation";
import { getPublicMenuByQRCode } from "@/features/qr-ordering/qr-menus/services/public-menu-service";
import { Store, Package } from "lucide-react";

interface Props { params: Promise<{ code: string }> }

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
  }).format(amount);
}

export default async function PublicMenuPage({ params }: Props) {
  const { code } = await params;
  const menu = await getPublicMenuByQRCode(code);

  if (!menu) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Business Header */}
      <div className="bg-background border-b">
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{menu.businessName}</h1>
              <p className="text-sm text-muted-foreground">Scan to order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mx-auto max-w-lg px-4 py-6">
        {menu.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No menu items available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {menu.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl bg-background p-4 shadow-sm border border-border"
              >
                {item.imageUrl && (
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <h3 className="font-semibold text-foreground truncate">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-1.5 font-bold text-blue-600">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mx-auto max-w-lg px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground/70">
          Powered by Enkai Business
        </p>
      </div>
    </div>
  );
}
