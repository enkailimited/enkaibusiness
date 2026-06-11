"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, MapPin, Globe } from "lucide-react";

import { getBusinessesAction } from "@/features/businesses/actions";

type Business = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  currency: string;
  isActive: boolean;
  createdAt: string;
  _count: { branches: number; staff: number; customers: number };
  modes: { industry: string; mode: string }[];
};

export default function WorkspaceBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getBusinessesAction();
    setBusinesses(data as unknown as Business[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Businesses"
        description={`${businesses.length} business${businesses.length !== 1 ? "es" : ""} in this workspace`}
      >
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Business
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <Building2 className="mb-4 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold">No businesses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first business to get started</p>
          <Button className="mt-4" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Create Business
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((biz) => (
            <Card key={biz.id} className="group hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={biz.isActive ? "success" : "secondary"} className="text-xs">
                    {biz.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold">{biz.name}</h3>
                  <p className="text-xs text-muted-foreground">{biz.slug}</p>
                  {biz.modes[0] && (
                    <p className="mt-1 text-xs text-primary font-medium">
                      {biz.modes[0].industry} · {biz.modes[0].mode}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                  <span>{biz._count.branches} branch{biz._count.branches !== 1 ? "es" : ""}</span>
                  <span>{biz._count.staff} staff</span>
                  <span>{biz._count.customers} customers</span>
                </div>

                {(biz.email || biz.phone) && (
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {biz.email && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{biz.email}</span>}
                    {biz.phone && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{biz.phone}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
