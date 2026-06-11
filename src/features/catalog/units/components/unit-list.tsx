import { getBusinessUnits } from "../services/unit-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { UNIT_TYPE_LABELS, UNIT_TYPE_VARIANTS } from "../constants";
import type { UnitWithCount } from "../types";

interface UnitListProps {
  businessId: string;
}

export async function UnitList({ businessId }: UnitListProps) {
  const units = await getBusinessUnits(businessId);

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
          data={units}
          emptyTitle="No units of measure"
          emptyDescription="Add units like Pieces, Kilograms, or Liters to use in your catalog"
        />
      </CardContent>
    </Card>
  );
}
