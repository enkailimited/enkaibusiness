"use client";

import { use, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, DollarSign, AlertTriangle, Truck, FileText, TrendingDown } from "lucide-react";
import {
  getPayablesSummaryAction,
  getOutstandingSuppliersAction,
  getPayablesAgingAction,
  getOutstandingPurchasesAction,
  getOverduePurchasesAction,
  getRecentSupplierPaymentsAction,
  recordPurchasePaymentAction,
} from "@/features/purchases/actions/payable-actions";

interface Props { params: Promise<{ businessId: string }> }

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n);
}

export default function PayablesPage({ params }: Props) {
  const { businessId } = use(params);
  const [summary, setSummary] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [aging, setAging] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payPurchaseId, setPayPurchaseId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, su, a, o, rp] = await Promise.all([
        getPayablesSummaryAction(businessId),
        getOutstandingSuppliersAction(businessId),
        getPayablesAgingAction(businessId),
        getOverduePurchasesAction(businessId),
        getRecentSupplierPaymentsAction(businessId),
      ]);
      setSummary(s);
      setSuppliers(su);
      setAging(a);
      setOverdue(o);
      setRecentPayments(rp);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePay = async () => {
    if (!payPurchaseId || !payAmount) return;
    setPaying(true);
    try {
      const formData = new FormData();
      formData.set("purchaseId", payPurchaseId);
      formData.set("amount", payAmount);
      formData.set("businessId", businessId);
      const result = await recordPurchasePaymentAction(null, formData);
      if (result.success) {
        setPayPurchaseId(null);
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
      <PageHeader title="Accounts Payable" description="Track supplier debts and payments" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Payables</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(summary?.totalOutstanding ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalOverdue ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Suppliers Owed</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary?.supplierCount ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Purchases</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary?.purchaseCount ?? 0}</p></CardContent>
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
                  <span className="text-sm font-semibold">{formatCurrency(bucket.total)} ({bucket.purchases} purchases)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Overdue Supplier Invoices</CardTitle></CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue supplier invoices</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {overdue.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div>
                      <p className="text-sm font-medium">{p.reference}</p>
                      <p className="text-xs text-muted-foreground">{p.supplierName} · Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(p.balanceDue)}</span>
                      <Button size="sm" variant="outline" onClick={() => { setPayPurchaseId(p.id); setPayAmount(String(p.balanceDue)); }}>Pay</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Top Suppliers by Balance</CardTitle></CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding supplier balances</p>
            ) : (
              <div className="space-y-3">
                {suppliers.slice(0, 10).map((s: any) => (
                  <div key={s.supplierId} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{s.supplierName}</p>
                      <p className="text-xs text-muted-foreground">{s.purchaseCount} purchase(s)</p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(s.totalOutstanding)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Supplier Payments</CardTitle></CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent payments</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{p.supplierName}</p>
                      <p className="text-xs text-muted-foreground">{p.reference} · {new Date(p.paidAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">-{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!payPurchaseId} onOpenChange={(o) => { if (!o) setPayPurchaseId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter the amount to pay against this purchase</DialogDescription>
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
