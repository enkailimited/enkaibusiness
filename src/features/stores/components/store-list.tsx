"use client";

import { useQuery } from "@tanstack/react-query";
import { getBranchStoresAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Store as StoreIcon } from "lucide-react";

interface StoreListProps {
  branchId: string;
}

export function StoreList({ branchId }: StoreListProps) {
  const query = useQuery({
    queryKey: ["stores", branchId],
    queryFn: async () => {
      const result = await getBranchStoresAction(branchId);
      return result ?? [];
    },
  });

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const stores = query.data ?? [];

  if (stores.length === 0) {
    return (
      <EmptyState
        title="No stores yet"
        description="Create your first store for this branch."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => (
        <Card key={store.id} className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <StoreIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{store.name}</CardTitle>
                  {store.code && <CardDescription>Code: {store.code}</CardDescription>}
                </div>
              </div>
              <Badge variant={store.isActive ? "success" : "secondary"}>
                {store.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {store.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
