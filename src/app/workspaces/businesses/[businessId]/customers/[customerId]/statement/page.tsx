import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/server/auth";
import { getCustomer } from "@/features/customers/services/customer-service";
import { getCustomerStatement } from "@/features/statements/services/statement-service";
import { formatCurrency } from "@/lib/utils";

interface Props { params: Promise<{ businessId: string; customerId: string }> }

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(new Date(iso));
}

export default async function CustomerStatementPage({ params }: Props) {
  const { businessId, customerId } = await params;
  await requireAuth();

  const customer = await getCustomer(customerId);
  if (!customer) notFound();

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const statement = await getCustomerStatement(customerId, businessId, from, to);

  const customerName = `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}`;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Customer Statement"
        description={customerName}
      >
        <Button variant="outline" asChild>
          <Link href={`/workspaces/businesses/${businessId}/customers/${customerId}`}>
            Back to Customer
          </Link>
        </Button>
      </PageHeader>

      <div className="rounded-xl border">
        <div className="border-b px-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Period: </span>
              {formatDate(from.toISOString())} — {formatDate(to.toISOString())}
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Opening Balance: </span>
              <span className="font-mono font-medium">{formatCurrency(statement.openingBalance)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Reference</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Debit</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Credit</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody>
              {statement.lines.map((line, idx) => (
                <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{formatDate(line.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{line.reference}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{line.description}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {line.debit > 0 ? formatCurrency(line.debit) : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {line.credit > 0 ? formatCurrency(line.credit) : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                    {formatCurrency(line.balance)}
                  </td>
                </tr>
              ))}
              {statement.lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No transactions in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-6 py-4">
          <div className="text-right text-sm">
            <span className="text-muted-foreground">Closing Balance: </span>
            <span className="font-mono font-medium">{formatCurrency(statement.closingBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
