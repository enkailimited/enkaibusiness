"use client";

import { useQuery } from "@tanstack/react-query";
import { getBusinessBranchesAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Store, Building2 } from "lucide-react";

interface BranchListProps {
  businessId: string;
}

export function BranchList({ businessId }: BranchListProps) {
  const query = useQuery({
    queryKey: ["branches", businessId],
    queryFn: async () => {
      const result = await getBusinessBranchesAction(businessId);
      return result ?? [];
    },
  });

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const branches = query.data ?? [];

  if (branches.length === 0) {
    return (
      <EmptyState
        title="No branches yet"
        description="Create your first branch for this business."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {branches.map((branch) => (
        <Card key={branch.id} className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {branch.isHeadOffice ? (
                    <Building2 className="h-5 w-5 text-primary" />
                  ) : (
                    <MapPin className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{branch.name}</CardTitle>
                  <CardDescription>{branch.city ?? branch.country}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {branch.isHeadOffice && (
                  <Badge variant="default">Head Office</Badge>
                )}
                <Badge variant={branch.isActive ? "success" : "secondary"}>
                  {branch.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Store className="h-4 w-4" />
                {branch._count.stores} stores
              </span>
              {branch.code && (
                <span className="text-xs">Code: {branch.code}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
