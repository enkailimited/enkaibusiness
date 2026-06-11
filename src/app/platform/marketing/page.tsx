"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getCampaignMetricsAction,
  getLeadSourcesAction,
  getConversionTrendAction,
} from "@/server/actions/marketing";
import {
  TrendingUp,
  Users,
  RefreshCw,
  BarChart3,
  CalendarDays,
} from "lucide-react";

type Tab = "overview" | "sources" | "trend";

interface CampaignMetrics {
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
}

interface LeadSource {
  source: string;
  count: number;
}

interface ConversionTrend {
  date: string;
  conversions: number;
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: TrendingUp },
  { key: "sources", label: "Sources", icon: BarChart3 },
  { key: "trend", label: "Trend", icon: CalendarDays },
];

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  SELF_REGISTRATION: "Self Registration",
  SALES_REGISTRATION: "Sales Registration",
  REFERRAL: "Referral",
  CAMPAIGN: "Campaign",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PlatformMarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [trend, setTrend] = useState<ConversionTrend[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const data = await getCampaignMetricsAction();
      setMetrics(data);
    } catch {
      console.error("Failed to load campaign metrics");
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const loadSources = useCallback(async () => {
    setLoadingSources(true);
    try {
      const data = await getLeadSourcesAction();
      setSources(data);
    } catch {
      console.error("Failed to load lead sources");
    } finally {
      setLoadingSources(false);
    }
  }, []);

  const loadTrend = useCallback(async () => {
    setLoadingTrend(true);
    try {
      const data = await getConversionTrendAction(30);
      setTrend(data);
    } catch {
      console.error("Failed to load conversion trend");
    } finally {
      setLoadingTrend(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadSources();
    loadTrend();
  }, [loadMetrics, loadSources, loadTrend]);

  const maxSourceCount = sources.length > 0 ? Math.max(...sources.map((s) => s.count)) : 0;
  const maxTrendConversions = trend.length > 0 ? Math.max(...trend.map((t) => t.conversions)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing" description="Platform marketing management">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadMetrics(); loadSources(); loadTrend(); }}
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.totalLeads ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.totalConversions ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics ? `${metrics.conversionRate.toFixed(1)}%` : "0%"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "sources" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSources ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : sources.length === 0 ? (
              <EmptyState
                title="No lead sources"
                description="Lead data will appear once campaigns are active"
              />
            ) : (
              <div className="space-y-4">
                {sources.map((source) => (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {SOURCE_LABELS[source.source] || source.source}
                      </span>
                      <span className="text-muted-foreground">{source.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{
                          width: maxSourceCount > 0
                            ? `${(source.count / maxSourceCount) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "trend" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Conversion Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : trend.length === 0 ? (
              <EmptyState
                title="No conversion data"
                description="Conversion trends will appear once leads start converting"
              />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-[1fr_1fr] gap-4 rounded-lg bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                    <div>Date</div>
                    <div>Conversions</div>
                  </div>
                  <div className="divide-y">
                    {trend.map((entry) => (
                      <div
                        key={entry.date}
                        className="grid grid-cols-[1fr_1fr] gap-4 px-4 py-2 text-sm items-center"
                      >
                        <div className="text-muted-foreground">
                          {formatDate(entry.date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-5 bg-primary/20 rounded-sm transition-all" style={{ width: maxTrendConversions > 0 ? `${(entry.conversions / maxTrendConversions) * 100}%` : "0%", minWidth: entry.conversions > 0 ? "4px" : "0" }} />
                          <span className="text-sm font-medium">{entry.conversions}</span>
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
    </div>
  );
}
