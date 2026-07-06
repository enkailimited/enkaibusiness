"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Users, Building2, Target, DollarSign, ExternalLink } from "lucide-react";
import { getMySalesProfile, getMyPerformanceMetrics } from "@/server/actions/sales-team";
import { getMyTerritoriesAction } from "@/features/sales-network/actions/territory-actions";
import Link from "next/link";

export default function TerritoriesPage() {
  const { data: profile } = useQuery({
    queryKey: ["my-sales-profile"],
    queryFn: getMySalesProfile,
  });

  const { data: metrics } = useQuery({
    queryKey: ["my-performance-metrics"],
    queryFn: getMyPerformanceMetrics,
  });

  const { data: territoriesData } = useQuery({
    queryKey: ["my-territories"],
    queryFn: async () => {
      const res = await getMyTerritoriesAction();
      return res.success ? res.territories : [];
    },
  });

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Territories"
        description="Your assigned sales territories."
      >
        <Button variant="outline" asChild>
          <Link href="/platform/sales-team/territories/manage">
            <MapPin className="mr-2 h-4 w-4" /> Manage Territories
          </Link>
        </Button>
      </PageHeader>

      {/* Profile Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Region</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{profile?.region ?? "Not assigned"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.region ? "Your primary sales territory" : "No region has been assigned to your profile yet."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hierarchy Level</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{profile?.hierarchy?.title ?? "Not assigned"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.hierarchy?.description ?? "Your position in the sales hierarchy."}
            </p>
          </CardContent>
        </Card>
      </div>

      {profile?.manager && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {profile.manager.user.firstName} {profile.manager.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{profile.manager.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics?.totalLeads ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Leads</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{metrics?.convertedLeads ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Converted Clients</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{metrics?.activeClients ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Active Clients</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Territories */}
      {territoriesData && territoriesData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">My Territories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {territoriesData.map((territory) => (
              <Card key={territory.id} className="relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-1 w-full"
                  style={{ backgroundColor: territory.color ?? "#3b82f6" }}
                />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{territory.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{territory._count.leads} leads</span>
                    </div>
                    {territory.members.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        <span>Primary: {territory.members[0].salesProfile.user.firstName}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!profile?.region && !profile?.hierarchy && !profile?.manager && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MapPin className="mb-4 h-12 w-12" />
            <p className="text-sm">No territory information available</p>
            <p className="text-xs">Your region and hierarchy details will appear here once assigned.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
