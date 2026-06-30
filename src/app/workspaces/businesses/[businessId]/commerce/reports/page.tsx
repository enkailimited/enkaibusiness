"use client";

import { use, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSalesReportAction, getInventoryReportAction, getPurchasesReportAction, getExpensesReportAction, getCustomersReportAction, getSuppliersReportAction } from "@/features/reports/actions";
import { SalesReportView } from "@/features/reports/components/sales-report";
import { InventoryReportView } from "@/features/reports/components/inventory-report";
import { PurchasesReportView } from "@/features/reports/components/purchases-report";
import { ExpensesReportView } from "@/features/reports/components/expenses-report";
import { CustomersReportView } from "@/features/reports/components/customers-report";
import { SuppliersReportView } from "@/features/reports/components/suppliers-report";
import { ProfitLossReportView, CashFlowReportView } from "@/features/reports/components/profit-loss-report";

interface Props { params: Promise<{ businessId: string }> }

function ReportTab({ businessId }: { businessId: string }) {
  const [tab, setTab] = useState("sales");

  const salesQuery = useQuery({
    queryKey: ["report-sales", businessId],
    queryFn: async () => { const r = await getSalesReportAction(businessId); return r.data; },
    enabled: tab === "sales",
  });

  const inventoryQuery = useQuery({
    queryKey: ["report-inventory", businessId],
    queryFn: async () => { const r = await getInventoryReportAction(businessId); return r.data; },
    enabled: tab === "inventory",
  });

  const purchasesQuery = useQuery({
    queryKey: ["report-purchases", businessId],
    queryFn: async () => { const r = await getPurchasesReportAction(businessId); return r.data; },
    enabled: tab === "purchases",
  });

  const expensesQuery = useQuery({
    queryKey: ["report-expenses", businessId],
      queryFn: async () => { const r = await getExpensesReportAction(businessId); return r.data; },
    enabled: tab === "expenses",
  });

  const customersQuery = useQuery({
    queryKey: ["report-customers", businessId],
    queryFn: async () => { const r = await getCustomersReportAction(businessId); return r.data; },
    enabled: tab === "customers",
  });

  const suppliersQuery = useQuery({
    queryKey: ["report-suppliers", businessId],
    queryFn: async () => { const r = await getSuppliersReportAction(businessId); return r.data; },
    enabled: tab === "suppliers",
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="purchases">Purchases</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        <TabsTrigger value="profit-loss">P&L</TabsTrigger>
        <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
      </TabsList>

      <TabsContent value="sales">
        {salesQuery.isPending ? <Skeleton className="h-96 w-full rounded-2xl" /> : salesQuery.data ? <SalesReportView data={salesQuery.data} businessId={businessId} /> : <p className="text-muted-foreground">No data</p>}
      </TabsContent>

      <TabsContent value="inventory">
        {inventoryQuery.isPending ? <Skeleton className="h-96 w-full rounded-2xl" /> : inventoryQuery.data ? <InventoryReportView data={inventoryQuery.data} businessId={businessId} /> : <p className="text-muted-foreground">No data</p>}
      </TabsContent>

      <TabsContent value="purchases">
        {purchasesQuery.isPending ? <Skeleton className="h-96 w-full rounded-2xl" /> : purchasesQuery.data ? <PurchasesReportView data={purchasesQuery.data} businessId={businessId} /> : <p className="text-muted-foreground">No data</p>}
      </TabsContent>

      <TabsContent value="expenses">
        {expensesQuery.isPending ? <Skeleton className="h-96 w-full rounded-2xl" /> : expensesQuery.data ? <ExpensesReportView data={expensesQuery.data} businessId={businessId} /> : <p className="text-muted-foreground">No data</p>}
      </TabsContent>

      <TabsContent value="customers">
        {customersQuery.isPending ? <Skeleton className="h-96 w-full rounded-2xl" /> : customersQuery.data ? <CustomersReportView data={customersQuery.data} businessId={businessId} /> : <p className="text-muted-foreground">No data</p>}
      </TabsContent>

      <TabsContent value="suppliers">
        {suppliersQuery.isPending ? <Skeleton className="h-96 w-full rounded-2xl" /> : suppliersQuery.data ? <SuppliersReportView data={suppliersQuery.data} businessId={businessId} /> : <p className="text-muted-foreground">No data</p>}
      </TabsContent>

      <TabsContent value="profit-loss">
        <ProfitLossReportView businessId={businessId} />
      </TabsContent>

      <TabsContent value="cash-flow">
        <CashFlowReportView businessId={businessId} />
      </TabsContent>
    </Tabs>
  );
}

export default function ReportsPage({ params }: Props) {
  const { businessId } = use(params);
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Reports" description="Business performance reports" />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <ReportTab businessId={businessId} />
      </Suspense>
    </div>
  );
}
