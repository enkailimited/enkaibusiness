import { requireAuth } from "@/server/auth";
import { getRules } from "../services/rule-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { COMMISSION_TYPE_LABELS } from "../constants";
import type { RuleWithHierarchy } from "../types";

export async function RuleList() {
  await requireAuth();
  const rules = await getRules();

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (item: RuleWithHierarchy) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (item: RuleWithHierarchy) => (
        <Badge variant="secondary">{COMMISSION_TYPE_LABELS[item.type] ?? item.type}</Badge>
      ),
    },
    {
      key: "value",
      header: "Value",
      cell: (item: RuleWithHierarchy) => (
        <span className="font-mono text-sm">
          {item.type === "PERCENTAGE" ? `${Number(item.value)}%` : `$${Number(item.value)}`}
        </span>
      ),
    },
    {
      key: "hierarchyLevel",
      header: "Hierarchy Level",
      cell: (item: RuleWithHierarchy) =>
        item.hierarchyLevel ? (
          <Badge variant="outline">{item.hierarchyLevel.title}</Badge>
        ) : (
          <span className="text-muted-foreground">All Levels</span>
        ),
    },
    {
      key: "minAmount",
      header: "Min Amount",
      cell: (item: RuleWithHierarchy) => (
        <span className="text-muted-foreground text-sm font-mono">
          {item.minAmount ? `$${Number(item.minAmount)}` : "—"}
        </span>
      ),
    },
    {
      key: "maxAmount",
      header: "Max Amount",
      cell: (item: RuleWithHierarchy) => (
        <span className="text-muted-foreground text-sm font-mono">
          {item.maxAmount ? `$${Number(item.maxAmount)}` : "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (item: RuleWithHierarchy) => (
        <Badge variant={item.isActive ? "default" : "secondary"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rules}
      emptyTitle="No commission rules found"
      emptyDescription="Create your first commission rule to get started."
    />
  );
}
