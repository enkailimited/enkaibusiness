import { requireAuth } from "@/server/auth";
import { listPlans } from "../services/plan-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_INTERVAL_LABELS } from "../constants";
import type { PlanWithRelations } from "../types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
  }).format(amount);
}

export async function PlanList() {
  await requireAuth();
  const plans = await listPlans();

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (plan: PlanWithRelations) => (
        <span className="font-medium">{plan.name}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      cell: (plan: PlanWithRelations) => (
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{plan.slug}</code>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (plan: PlanWithRelations) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(Number(plan.amount))}
        </span>
      ),
    },
    {
      key: "interval",
      header: "Interval",
      cell: (plan: PlanWithRelations) => (
        <span>{SUBSCRIPTION_INTERVAL_LABELS[plan.interval] ?? plan.interval}</span>
      ),
    },
    {
      key: "subscriptions",
      header: "Subscribers",
      cell: (plan: PlanWithRelations) => (
        <span className="text-muted-foreground">
          {plan._count?.subscriptions ?? 0}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (plan: PlanWithRelations) => (
        <Badge variant={plan.isActive ? "success" : "secondary"}>
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={plans}
      emptyTitle="No subscription plans"
      emptyDescription="Create your first subscription plan to get started."
    />
  );
}
