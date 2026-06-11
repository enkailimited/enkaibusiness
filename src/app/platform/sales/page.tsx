"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserCheck,
  TrendingUp,
  Target,
  Search,
  Building2,
  BarChart3,
  UserPlus,
} from "lucide-react";
import {
  getSalesHierarchyAction,
  getSalesProfilesAction,
} from "@/server/actions/sales";
import { getLeadMetricsAction } from "@/server/actions/leads";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

type Tab = "overview" | "hierarchy" | "team";

interface SalesProfile {
  id: string;
  userId: string;
  phone: string | null;
  region: string | null;
  status: string;
  hierarchyId: string | null;
  managerId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
  };
  hierarchy: { id: string; title: string; slug: string; level: number } | null;
  manager: {
    id: string;
    user: { id: string; firstName: string; lastName: string };
  } | null;
  _count: { subordinates: number; leads: number };
}

interface HierarchyLevel {
  id: string;
  level: number;
  title: string;
  slug: string;
  description: string | null;
}

export default function PlatformSalesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [profiles, setProfiles] = useState<SalesProfile[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
  const [metrics, setMetrics] = useState<{
    totalLeads: number;
    totalConverted: number;
    convertedThisMonth: number;
    lostCount: number;
    conversionRate: number;
    statusBreakdown: { status: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "hierarchy", label: "Hierarchy", icon: Building2 },
    { id: "team", label: "Team", icon: Users },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesData, hierarchyData, metricsData] = await Promise.all([
        getSalesProfilesAction(),
        getSalesHierarchyAction(),
        getLeadMetricsAction(),
      ]);
      setProfiles(profilesData as SalesProfile[]);
      setHierarchy(hierarchyData as HierarchyLevel[]);
      setMetrics(
        metricsData as {
          totalLeads: number;
          totalConverted: number;
          convertedThisMonth: number;
          lostCount: number;
          conversionRate: number;
          statusBreakdown: { status: string; count: number }[];
        },
      );
    } catch (error) {
      console.error("Failed to load sales data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProfiles = searchQuery
    ? profiles.filter(
        (p) =>
          p.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.region?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : profiles;

  const statusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success" as const;
      case "INACTIVE":
        return "secondary" as const;
      case "SUSPENDED":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description="Platform sales management">
        <Link href="/platform/sales/profiles">
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Manage Profiles
          </Button>
        </Link>
        <Link href="/platform/sales/hierarchy">
          <Button variant="outline" size="sm">
            <Building2 className="mr-2 h-4 w-4" />
            Hierarchy
          </Button>
        </Link>
      </PageHeader>

      <div className="flex gap-1 rounded-lg border p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Team
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-2xl font-bold">{profiles.length}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Freelancers
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-2xl font-bold">
                    {
                      profiles.filter(
                        (p) =>
                          p.status === "ACTIVE" &&
                          p.hierarchy?.slug === "freelancer",
                      ).length
                    }
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Leads Generated
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-2xl font-bold">
                    {metrics?.totalLeads ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-2xl font-bold">
                    {metrics ? `${metrics.conversionRate.toFixed(1)}%` : "0%"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Lead Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-4 animate-pulse rounded bg-muted"
                      />
                    ))}
                  </div>
                ) : metrics?.statusBreakdown &&
                  metrics.statusBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.statusBreakdown.map((item) => (
                      <div
                        key={item.status}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {item.status.toLowerCase()}
                        </span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No lead data available
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Hierarchy Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-4 animate-pulse rounded bg-muted"
                      />
                    ))}
                  </div>
                ) : hierarchy.length > 0 ? (
                  <div className="space-y-3">
                    {hierarchy.map((level) => (
                      <div
                        key={level.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{level.title}</span>
                        <Badge variant="secondary">
                          {
                            profiles.filter(
                              (p) => p.hierarchyId === level.id,
                            ).length
                          }
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hierarchy defined
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === "hierarchy" && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Team Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            ) : hierarchy.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hierarchy levels configured yet.
              </p>
            ) : (
              <div className="space-y-1">
                {hierarchy.map((level) => {
                  const levelProfiles = profiles.filter(
                    (p) => p.hierarchyId === level.id,
                  );
                  return (
                    <div key={level.id} className="group">
                      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {level.level}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {level.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {levelProfiles.length} member
                            {levelProfiles.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Level {level.level}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "team" && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Team</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or region..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            ) : filteredProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No profiles match your search."
                  : "No sales profiles found."}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="hidden grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Region</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Leads</div>
                  <div className="col-span-2">Actions</div>
                </div>
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="grid grid-cols-1 gap-2 rounded-lg border p-4 md:grid-cols-12 md:items-center md:gap-4"
                  >
                    <div className="flex items-center gap-3 md:col-span-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(
                          profile.user.firstName,
                          profile.user.lastName,
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {profile.user.firstName} {profile.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {profile.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm md:col-span-2">
                      {profile.hierarchy?.title ?? "—"}
                    </div>
                    <div className="text-sm text-muted-foreground md:col-span-2">
                      {profile.region ?? "—"}
                    </div>
                    <div className="md:col-span-1">
                      <Badge variant={statusVariant(profile.status)}>
                        {profile.status}
                      </Badge>
                    </div>
                    <div className="text-sm md:col-span-2">
                      {profile._count.leads} leads
                    </div>
                    <div className="flex gap-2 md:col-span-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

