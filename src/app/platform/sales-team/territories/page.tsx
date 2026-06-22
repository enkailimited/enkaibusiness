"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Globe, Users, Building2 } from "lucide-react";
import { getMySalesProfile, getMyPerformanceMetrics } from "@/server/actions/sales-team";

export default function TerritoriesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, perf] = await Promise.all([
        getMySalesProfile(),
        getMyPerformanceMetrics(),
      ]);
      setProfile(prof ?? null);
      setMetrics(perf ?? null);
    } catch (err) {
      console.error("Failed to fetch territories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Territories" description="Your assigned sales territories." />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="h-8 w-32 animate-pulse rounded bg-muted mb-4" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Territory Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{metrics?.totalLeads ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Leads in Territory</p>
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

          {!profile?.region && !profile?.hierarchy && !profile?.manager && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MapPin className="mb-4 h-12 w-12" />
                <p className="text-sm">No territory information available</p>
                <p className="text-xs">Your region and hierarchy details will appear here once assigned.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
