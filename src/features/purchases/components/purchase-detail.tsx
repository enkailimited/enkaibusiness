import { requireAuth } from "@/server/auth";
import { getPurchase } from "../services/purchase-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_VARIANTS } from "../constants";

interface PurchaseDetailProps {
  purchaseId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function PurchaseDetail({ purchaseId }: PurchaseDetailProps) {
  await requireAuth();
  const purchase = await getPurchase(purchaseId);

  if (!purchase) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Purchase not found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Purchase {purchase.reference ? `#${purchase.reference}` : ""}</CardTitle>
            <Badge variant={PURCHASE_STATUS_VARIANTS[purchase.status] ?? "secondary"}>
              {PURCHASE_STATUS_LABELS[purchase.status] ?? purchase.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Supplier:</span>{" "}
              <span className="font-medium">{purchase.supplier.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>{" "}
              <span className="font-medium">{formatDate(purchase.purchaseDate)}</span>
            </div>
            {purchase.staff && (
              <div>
                <span className="text-muted-foreground">Staff:</span>{" "}
                <span className="font-medium">
                  {purchase.staff.firstName} {purchase.staff.lastName}
                </span>
              </div>
            )}
            {purchase.createdBy && (
              <div>
                <span className="text-muted-foreground">Created by:</span>{" "}
                <span className="font-medium">
                  {purchase.createdBy.firstName} {purchase.createdBy.lastName}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-muted-foreground">Item</th>
                <th className="pb-2 font-medium text-muted-foreground">Qty</th>
                <th className="pb-2 font-medium text-muted-foreground">Unit Cost</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">
                    <div className="font-medium">{item.catalogItem.name}</div>
                    {item.catalogItem.sku && (
                      <div className="text-xs text-muted-foreground">SKU: {item.catalogItem.sku}</div>
                    )}
                  </td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatCurrency(item.unitCost)}</td>
                  <td className="py-2 text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-4 text-right font-medium">
                  Subtotal
                </td>
                <td className="pt-4 text-right font-medium">{formatCurrency(purchase.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right text-muted-foreground">
                  Tax
                </td>
                <td className="text-right text-muted-foreground">{formatCurrency(purchase.tax)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right font-bold text-lg">
                  Total
                </td>
                <td className="text-right font-bold text-lg">{formatCurrency(purchase.total)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {purchase.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
