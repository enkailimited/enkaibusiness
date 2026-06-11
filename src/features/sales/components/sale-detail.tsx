import { requireAuth } from "@/server/auth";
import { getSale } from "../services/sale-service";
import { Badge } from "@/components/ui/badge";
import { SALE_STATUS_LABELS, SALE_STATUS_VARIANTS } from "../constants";

interface SaleDetailProps {
  id: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function SaleDetail({ id }: SaleDetailProps) {
  await requireAuth();
  const sale = await getSale(id);

  if (!sale) {
    return <div className="text-muted-foreground">Sale not found</div>;
  }

  const customerName = sale.customer
    ? `${sale.customer.firstName}${sale.customer.lastName ? ` ${sale.customer.lastName}` : ""}`
    : "Walk-in";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{sale.reference ?? "Sale"}</h2>
          <p className="text-muted-foreground">{formatDate(sale.saleDate)}</p>
        </div>
        <Badge variant={SALE_STATUS_VARIANTS[sale.status] ?? "secondary"}>
          {SALE_STATUS_LABELS[sale.status] ?? sale.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div>
          <span className="text-sm text-muted-foreground">Customer</span>
          <p className="font-medium">{customerName}</p>
          {sale.customer?.phone && <p className="text-sm text-muted-foreground">{sale.customer.phone}</p>}
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Staff</span>
          <p className="font-medium">
            {sale.staff ? `${sale.staff.firstName} ${sale.staff.lastName}` : "—"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Items</h3>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Item</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-right font-medium">Discount</th>
                <th className="px-4 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-medium">{item.catalogItem.name}</span>
                    {item.catalogItem.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">({item.catalogItem.sku})</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{Number(item.quantity)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(item.discount)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-1 rounded-lg border bg-muted/50 p-4 text-right">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Discount</span>
          <span>{formatCurrency(sale.discountTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>{formatCurrency(sale.taxTotal)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Grand Total</span>
          <span>{formatCurrency(sale.grandTotal)}</span>
        </div>
      </div>

      {sale.notes && (
        <div className="rounded-lg border p-4">
          <span className="text-sm text-muted-foreground">Notes</span>
          <p className="mt-1">{sale.notes}</p>
        </div>
      )}
    </div>
  );
}
