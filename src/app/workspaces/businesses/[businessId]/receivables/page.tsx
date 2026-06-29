"use client";

import { use, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, DollarSign, AlertTriangle, Users, FileText, TrendingUp } from "lucide-react";
import { getBusinessReceivablesSummaryAction, getBusinessOutstandingCustomersAction, getReceivablesAgingAction, getOverdueInvoicesAction, recordInvoicePaymentAction } from "@/features/invoices/actions/receivable-actions";

interface Props { params: Promise<{ businessId: string }> }

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n);
}

export default function ReceivablesPage({ params }: Props) {
  const { businessId } = use(params);
  const [summary, setSummary] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [aging, setAging] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, a, o] = await Promise.all([
        getBusinessReceivablesSummaryAction(businessId),
        getBusinessOutstandingCustomersAction(businessId),
        getReceivablesAgingAction(businessId),
        getOverdueInvoicesAction(businessId),
      ]);
      setSummary(s);
      setCustomers(c);
      setAging(a);
      setOverdue(o);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePay = async () => {
    if (!payInvoiceId || !payAmount) return;
    setPaying(true);
    try {
      const formData = new FormData();
      formData.set("invoiceId", payInvoiceId);
      formData.set("amount", payAmount);
      formData.set("businessId", businessId);
      const result = await recordInvoicePaymentAction(null, formData);
      if (result.success) {
        setPayInvoiceId(null);
        setPayAmount("");
        fetchData();
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="space-y-6 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Accounts Receivable" description="Track customer debts and payments" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Receivables</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(summary?.totalOutstanding ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalOverdue ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Debtors</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary?.customerCount ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Invoices</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary?.invoiceCount ?? 0}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Aging Analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aging.map((bucket: any) => (
                <div key={bucket.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{bucket.label}</span>
                  <span className="text-sm font-semibold">{formatCurrency(bucket.total)} ({bucket.invoices} invoices)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Overdue Invoices</CardTitle></CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue invoices</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {overdue.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(inv.balanceDue)}</span>
                      <Button size="sm" variant="outline" onClick={() => { setPayInvoiceId(inv.id); setPayAmount(String(inv.balanceDue)); }}>Pay</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Top Debtors</CardTitle></CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outstanding customer balances</p>
          ) : (
            <div className="space-y-3">
              {customers.slice(0, 10).map((c: any) => (
                <div key={c.customerId} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{c.customerName}</p>
                    <p className="text-xs text-muted-foreground">{c.invoiceCount} invoice(s) · Last: {c.daysSinceOldest}d ago</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(c.totalOutstanding)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!payInvoiceId} onOpenChange={(o) => { if (!o) setPayInvoiceId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter the amount to record against this invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="number"
              min="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-lg font-semibold outline-none focus:border-blue-300"
              placeholder="Amount"
              autoFocus
            />
            <Button onClick={handlePay} disabled={paying || !payAmount} className="w-full">
              {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
