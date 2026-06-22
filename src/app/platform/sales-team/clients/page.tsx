"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, Building2, Phone, Mail, Calendar } from "lucide-react";
import { getMyClients } from "@/server/actions/sales-team";
import { formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const [data, setData] = useState<{ convertedLeads: any[]; businesses: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyClients();
      setData(result as any);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalClients = (data?.convertedLeads?.length ?? 0) + (data?.businesses?.length ?? 0);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Clients" description="Manage your clients." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold">{totalClients}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold">{data?.convertedLeads?.length ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registered Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold">{data?.businesses?.length ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : totalClients === 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Clients</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="mb-4 h-12 w-12" />
            <p className="text-sm">No clients yet</p>
            <p className="text-xs">Your converted leads and registered businesses will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {data?.convertedLeads && data.convertedLeads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Converted Leads</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.convertedLeads.map((lead: any) => (
                    <div key={lead.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                        {lead.businessName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lead.businessName}
                          </p>
                        )}
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                        )}
                      </div>
                      <Badge variant="default" className="shrink-0">Converted</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data?.businesses && data.businesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registered Businesses</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.businesses.map((biz: any) => (
                    <div key={biz.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{biz.name}</p>
                        <p className="text-xs text-muted-foreground">{biz.email ?? biz.phone ?? "—"}</p>
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(biz.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
