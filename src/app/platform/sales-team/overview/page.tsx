"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  BarChart3,
  Target,
  Users,
  DollarSign,
  PhoneCall,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import {
  getMySalesStats,
  getMyPerformanceMetrics,
  getMyCommissionMetrics,
  getMyLeadMetrics,
  getMyClients,
} from "@/server/actions/sales-team";
import { getTeamPipelineAction } from "@/features/sales-network/actions/lead-actions";
import { formatCurrency } from "@/lib/utils";

const SALES_ROLES = [
  "national-sales-manager",
  "national-manager",
  "regional-manager",
  "team-leader",
  "freelancer",
];

const PIPELINE_ORDER = [
  "NEW", "CONTACTED", "APPOINTMENT_SET", "INTERESTED", "DEMO",
  "PROPOSAL", "NEGOTIATION", "REGISTERED", "INSTALLED", "ACTIVE",
  "CONVERTED", "LOST",
];

const STAGE_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", APPOINTMENT_SET: "Appt Set",
  INTERESTED: "Interested", DEMO: "Demo", PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation", REGISTERED: "Registered",
  INSTALLED: "Installed", ACTIVE: "Active", CONVERTED: "Converted", LOST: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-slate-200", CONTACTED: "bg-blue-200", APPOINTMENT_SET: "bg-cyan-200",
  INTERESTED: "bg-teal-200", DEMO: "bg-indigo-200", PROPOSAL: "bg-violet-200",
  NEGOTIATION: "bg-amber-200", REGISTERED: "bg-orange-200",
  INSTALLED: "bg-emerald-200", ACTIVE: "bg-green-300",
  CONVERTED: "bg-green-500", LOST: "bg-red-200",
};

function PipelineBar({ stages, total }: { stages: Record<string, number>; total: number }) {
  const sorted = PIPELINE_ORDER.filter((s) => (stages[s] ?? 0) > 0);
  if (sorted.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">No leads yet</p>;
  return (
    <div className="flex h-8 w-full overflow-hidden rounded-lg">
      {sorted.map((s) => {
        const pct = total > 0 ? ((stages[s] ?? 0) / total) * 100 : 0;
        if (pct < 1) return null;
        return (
          <div
            key={s}
            className={`${STAGE_COLORS[s] ?? ""} flex items-center justify-center text-[10px] font-semibold text-gray-700 first:rounded-l-lg last:rounded-r-lg`}
            style={{ width: `${pct}%` }}
            title={`${STAGE_LABELS[s]}: ${stages[s]}`}
          >
            {pct > 8 ? stages[s] : null}
          </div>
        );
      })}
    </div>
  );
}

function TeamMemberRow({ member }: { member: any }) {
  const stages = member.stages || {};
  const total = member.totalLeads || 0;
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex-1">
        <span className="text-sm font-medium">{member.name}</span>
        <span className="text-xs text-muted-foreground ml-2">{member.hierarchy}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold w-16 text-right">{total} leads</span>
        <div className="w-32">
          <PipelineBar stages={stages} total={total} />
        </div>
      </div>
    </div>
  );
}

export default function SalesTeamOverview() {
  const { user } = useAuth();
  const [salesStats, setSalesStats] = useState<any>(null);
//   const [perfMetrics, setPerfMetrics] = useState<any>(null);
  const [commMetrics, setCommMetrics] = useState<any>(null);
  const [leadMetrics, setLeadMetrics] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showTeam, setShowTeam] = useState(false);
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

  const fetchTeam = useCallback(async () => {
    try {
      const profile = await import("@/server/actions/sales-team").then((m) => m.getMySalesProfile());
      if (profile?.id) {
        const members = await getTeamPipelineAction(profile.id);
        setTeamMembers(members);
      }
    } catch { /* not a manager */ }
  }, []);

  useEffect(() => {
    fetchData();
    fetchTeam();
  }, [fetchData, fetchTeam]);

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
  const stageMap: Record<string, number> = {};
  statusCounts.forEach((s: any) => { stageMap[s.status] = s._count?.id ?? 0; });
  const totalLeads = leadMetrics?.totalLeads ?? 0;
  const convertedLeads = stageMap["CONVERTED"] ?? 0;
  const activeLeads = stageMap["ACTIVE"] ?? 0;
  const lostLeads = stageMap["LOST"] ?? 0;
  const conversionRate = totalLeads > 0 ? Math.round(((convertedLeads + activeLeads) / totalLeads) * 100) : 0;

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

      {/* KPI Summary */}
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

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-cyan-600" />
            <CardTitle className="text-base">Pipeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PipelineBar stages={stageMap} total={totalLeads} />
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_ORDER.filter((s) => (stageMap[s] ?? 0) > 0).map((s) => (
              <Badge key={s} variant="outline" className={`text-xs ${STAGE_COLORS[s]} border-0`}>
                {STAGE_LABELS[s]}: {stageMap[s]}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="text-center"><p className="text-2xl font-bold text-cyan-600">{stageMap["NEW"] ?? 0}</p><p className="text-xs text-muted-foreground">New</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-blue-600">{stageMap["CONTACTED"] ?? 0}</p><p className="text-xs text-muted-foreground">Contacted</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-violet-600">{(stageMap["DEMO"] ?? 0) + (stageMap["APPOINTMENT_SET"] ?? 0) + (stageMap["INTERESTED"] ?? 0) + (stageMap["PROPOSAL"] ?? 0) + (stageMap["NEGOTIATION"] ?? 0)}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-emerald-600">{convertedLeads + activeLeads}</p><p className="text-xs text-muted-foreground">Converted</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Team Pipeline (Team Leaders only) */}
      {teamMembers.length > 0 && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowTeam(!showTeam)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base">Team Pipeline</CardTitle>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${showTeam ? "rotate-90" : ""}`} />
            </div>
          </CardHeader>
          {showTeam && (
            <CardContent>
              {teamMembers.map((m: any) => (
                <TeamMemberRow key={m.profileId} member={m} />
              ))}
            </CardContent>
          )}
        </Card>
      )}

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
              <Users className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base">Client Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Active Clients", value: `${clientCount}` },
                { label: "Converted Leads", value: `${convertedLeads}` },
                { label: "Lost Leads", value: `${lostLeads}` },
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
              <DollarSign className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Commission Earned", value: formatCurrency(commMetrics?.totalEarned ?? 0) },
                { label: "Commission Pending", value: formatCurrency(commMetrics?.totalPending ?? 0) },
                { label: "Total Paid", value: formatCurrency(commMetrics?.totalPaid ?? 0) },
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
      </div>
    </div>
  );
}
