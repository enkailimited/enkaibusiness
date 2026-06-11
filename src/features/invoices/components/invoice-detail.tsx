import { requireAuth } from "@/server/auth";
import { getInvoiceWithRelations } from "../services/invoice-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INVOICE_STATUS_LABELS } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceDetailProps {
  id: string;
}

export async function InvoiceDetail({ id }: InvoiceDetailProps) {
  await requireAuth();
  const invoice = await getInvoiceWithRelations(id);

  if (!invoice) {
    return <p className="text-muted-foreground">Invoice not found.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customer: {invoice.customer.firstName}{invoice.customer.lastName ? ` ${invoice.customer.lastName}` : ""}
            </p>
          </div>
          <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "secondary"}>
            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Invoice Date:</span>
            <p>{formatDate(invoice.invoiceDate)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Due Date:</span>
            <p>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Sale:</span>
            <p>{invoice.sale ? "Linked" : "Standalone"}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Items</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.description ?? item.catalogItemId ?? "—"}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2 font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-2 font-mono">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1 text-sm border-t pt-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-mono">{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-mono">{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Balance Due</span>
            <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notes:</span>
            <p>{invoice.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
