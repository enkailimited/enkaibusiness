"use client";

import { useQuery } from "@tanstack/react-query";
import { listUnitsAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { UNIT_TYPE_LABELS, UNIT_TYPE_VARIANTS } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { UnitWithCount } from "../types";

interface UnitListProps {
  businessId: string;
}

export function UnitList({ businessId }: UnitListProps) {
  const query = useQuery({
    queryKey: ["units", businessId],
    queryFn: async () => {
      const result = await listUnitsAction(businessId);
      return (result ?? []) as UnitWithCount[];
    },
  });

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Units of Measure</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<UnitWithCount>
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.name}</span>
                  {r.isBase && <Badge variant="outline" className="text-xs">Base</Badge>}
                </div>
              ),
            },
            {
              key: "abbreviation",
              header: "Abbreviation",
              cell: (r) => <code className="text-xs font-mono">{r.abbreviation}</code>,
            },
            {
              key: "type",
              header: "Type",
              cell: (r) => (
                <Badge variant={UNIT_TYPE_VARIANTS[r.type] ?? "default"}>
                  {UNIT_TYPE_LABELS[r.type] ?? r.type}
                </Badge>
              ),
            },
            {
              key: "items",
              header: "Items",
              cell: (r) => r._count.catalogItems,
            },
          ]}
          data={query.data ?? []}
          emptyTitle="No units of measure"
          emptyDescription="Add units like Pieces, Kilograms, or Liters to use in your catalog"
        />
      </CardContent>
    </Card>
  );
}
