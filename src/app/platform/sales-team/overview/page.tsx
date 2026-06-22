"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  BarChart3,
  Target,
  Users,
  DollarSign,
  PhoneCall,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  getMySalesStats,
  getMyPerformanceMetrics,
  getMyCommissionMetrics,
  getMyLeadMetrics,
  getMyClients,
} from "@/server/actions/sales-team";
import { formatCurrency } from "@/lib/utils";

const SALES_ROLES = [
  "national-sales-manager",
  "national-manager",
  "regional-manager",
  "team-leader",
  "freelancer",
];

export default function SalesTeamOverview() {
  const { user } = useAuth();
  const [salesStats, setSalesStats] = useState<any>(null);
  const [perfMetrics, setPerfMetrics] = useState<any>(null);
  const [commMetrics, setCommMetrics] = useState<any>(null);
  const [leadMetrics, setLeadMetrics] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sales, perf, comm, leads, clients] = await Promise.all([
        getMySalesStats(),
        getMyPerformanceMetrics(),
        getMyCommissionMetrics(),
        getMyLeadMetrics(),
        getMyClients(),
      ]);
      setSalesStats(sales);
      setPerfMetrics(perf);
      setCommMetrics(comm);
      setLeadMetrics(leads);
      setClientData(clients);
    } catch (err) {
      console.error("Failed to fetch overview data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isSalesTeam = user?.roles?.some((r) => SALES_ROLES.includes(r)) ?? false;

  if (!isSalesTeam) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader title="Overview" description="Sales team performance overview." showBackButton />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You do not have a sales team role assigned.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCounts = leadMetrics?.statusCounts ?? [];
  const newLeads = statusCounts.find((s: any) => s.status === "NEW")?._count?.id ?? 0;
  const contactedLeads = statusCounts.find((s: any) => s.status === "CONTACTED")?._count?.id ?? 0;
  const convertedLeads = statusCounts.find((s: any) => s.status === "CONVERTED")?._count?.id ?? 0;
  const totalLeads = leadMetrics?.totalLeads ?? 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const clientCount = (clientData?.convertedLeads?.length ?? 0) + (clientData?.businesses?.length ?? 0);

  const kpiCards = [
    { label: "Today", value: loading ? "..." : formatCurrency(salesStats?.today?.amount ?? 0), icon: BarChart3, color: "text-blue-600" },
    { label: "This Week", value: loading ? "..." : formatCurrency(salesStats?.week?.amount ?? 0), icon: TrendingUp, color: "text-emerald-600" },
    { label: "This Month", value: loading ? "..." : formatCurrency(salesStats?.month?.amount ?? 0), icon: Target, color: "text-violet-600" },
    { label: "Clients", value: loading ? "..." : `${clientCount}`, icon: Users, color: "text-indigo-600" },
    { label: "Commission", value: loading ? "..." : formatCurrency(commMetrics?.totalEarned ?? 0), icon: DollarSign, color: "text-amber-600" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader title="Overview" description="Your complete sales performance at a glance." showBackButton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Overview"
        description="Your complete sales performance at a glance."
        showBackButton
      />

      {/* KPI Summary Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <kpi.icon className={"h-4 w-4 " + kpi.color} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Sales Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Today's Sales", value: formatCurrency(salesStats?.today?.amount ?? 0) },
                { label: "This Week", value: formatCurrency(salesStats?.week?.amount ?? 0) },
                { label: "This Month", value: formatCurrency(salesStats?.month?.amount ?? 0) },
                { label: "Monthly Sales Count", value: `${salesStats?.month?.count ?? 0} sales` },
              ].map((item, idx) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                  {idx < 3 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-cyan-600" />
              <CardTitle className="text-base">Leads Pipeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "New Leads", value: `${newLeads}` },
                { label: "Contacted", value: `${contactedLeads}` },
                { label: "Converted", value: `${convertedLeads}` },
                { label: "Conversion Rate", value: `${conversionRate}%` },
              ].map((item, idx) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                  {idx < 3 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base">Client Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Active Clients", value: `${clientCount}` },
                { label: "Converted Leads", value: `${clientData?.convertedLeads?.length ?? 0}` },
                { label: "Businesses Created", value: `${clientData?.businesses?.length ?? 0}` },
                { label: "Total Leads", value: `${totalLeads}` },
              ].map((item, idx) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                  {idx < 3 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Commission Earned", value: formatCurrency(commMetrics?.totalEarned ?? 0) },
                { label: "Commission Pending", value: formatCurrency(commMetrics?.totalPending ?? 0) },
                { label: "Total Approved", value: formatCurrency(commMetrics?.totalApproved ?? 0) },
                { label: "Total Paid", value: formatCurrency(commMetrics?.totalPaid ?? 0) },
              ].map((item, idx) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                  {idx < 3 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
