"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getFinancialSummaryAction,
  getRevenueByPeriodAction,
  getCommissionExpensesAction,
} from "@/server/actions/finance";
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";

type Tab = "overview" | "revenue" | "expenses";
type RevenuePeriod = "day" | "week" | "month";

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  net: number;
  activeSubscriptions: number;
}

interface RevenueEntry {
  date: string;
  amount: number;
}

interface RevenueByPeriod {
  byDay: RevenueEntry[];
  byWeek: RevenueEntry[];
  byMonth: RevenueEntry[];
}

interface CommissionExpenses {
  totalCommissionsPaid: number;
  totalCommissionsPending: number;
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: DollarSign },
  { key: "revenue", label: "Revenue", icon: TrendingUp },
  { key: "expenses", label: "Expenses", icon: Wallet },
];

const PERIOD_OPTIONS: { key: RevenuePeriod; label: string }[] = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + (dateStr.length === 7 ? "-01T00:00:00" : "T00:00:00"));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPeriodDate(dateStr: string, period: RevenuePeriod) {
  if (period === "month") {
    const [year, month] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return formatDate(dateStr);
}

export default function PlatformFinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("day");
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueByPeriod | null>(null);
  const [expenses, setExpenses] = useState<CommissionExpenses | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await getFinancialSummaryAction();
      setSummary(data);
    } catch {
      console.error("Failed to load financial summary");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadRevenue = useCallback(async () => {
    setLoadingRevenue(true);
    try {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      const data = await getRevenueByPeriodAction(startDate.toISOString());
      setRevenueData(data);
    } catch {
      console.error("Failed to load revenue data");
    } finally {
      setLoadingRevenue(false);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const data = await getCommissionExpensesAction();
      setExpenses(data);
    } catch {
      console.error("Failed to load commission expenses");
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    loadRevenue();
    loadExpenses();
  }, [loadSummary, loadRevenue, loadExpenses]);

  const currentRevenueEntries =
    revenuePeriod === "day"
      ? revenueData?.byDay
      : revenuePeriod === "week"
        ? revenueData?.byWeek
        : revenueData?.byMonth;

  const maxRevenueAmount =
    currentRevenueEntries && currentRevenueEntries.length > 0
      ? Math.max(...currentRevenueEntries.map((e) => e.amount))
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Finance" description="Platform financial management">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadSummary(); loadRevenue(); loadExpenses(); }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary ? formatCurrency(summary.totalRevenue) : "TZS 0"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Expenses</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary ? formatCurrency(summary.totalExpenses) : "TZS 0"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary ? formatCurrency(summary.net) : "TZS 0"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary?.activeSubscriptions ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "revenue" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Revenue</CardTitle>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRevenuePeriod(opt.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    revenuePeriod === opt.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !currentRevenueEntries || currentRevenueEntries.length === 0 ? (
              <EmptyState
                title="No revenue data"
                description="Revenue will appear once subscription payments are received"
              />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-[1fr_1fr] gap-4 rounded-lg bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                    <div>Period</div>
                    <div>Amount</div>
                  </div>
                  <div className="divide-y">
                    {currentRevenueEntries.map((entry) => (
                      <div
                        key={entry.date}
                        className="grid grid-cols-[1fr_1fr] gap-4 px-4 py-2 text-sm items-center"
                      >
                        <div className="text-muted-foreground">
                          {formatPeriodDate(entry.date, revenuePeriod)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-5 bg-green-100 dark:bg-green-900/50 rounded-sm transition-all"
                            style={{
                              width:
                                maxRevenueAmount > 0
                                  ? `${(entry.amount / maxRevenueAmount) * 100}%`
                                  : "0%",
                              minWidth: entry.amount > 0 ? "4px" : "0",
                            }}
                          />
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatCurrency(entry.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "expenses" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div>
                  <div className="text-2xl font-bold">
                    {expenses ? formatCurrency(expenses.totalCommissionsPaid) : "TZS 0"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Commission payments that have been disbursed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div>
                  <div className="text-2xl font-bold">
                    {expenses ? formatCurrency(expenses.totalCommissionsPending) : "TZS 0"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Commission payments awaiting disbursement
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
