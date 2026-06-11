import { requireAuth } from "@/server/auth";
import { listSubscriptions } from "../services/subscription-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_VARIANTS,
  SUBSCRIPTION_INTERVAL_LABELS,
} from "../constants";
import type { SubscriptionListItem } from "../types";

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
  }).format(amount);
}

export async function SubscriptionList() {
  await requireAuth();
  const subscriptions = await listSubscriptions();

  const columns = [
    {
      key: "business",
      header: "Business",
      cell: (sub: SubscriptionListItem) => (
        <span className="font-medium">{sub.business.name}</span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (sub: SubscriptionListItem) => (
        <span>
          {sub.plan.name}{" "}
          <span className="text-xs text-muted-foreground">
            ({formatCurrency(sub.plan.amount)} /{" "}
            {SUBSCRIPTION_INTERVAL_LABELS[sub.plan.interval]})
          </span>
        </span>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      cell: (sub: SubscriptionListItem) => (
        <span className="text-muted-foreground">
          {formatDate(sub.startDate)}
        </span>
      ),
    },
    {
      key: "endDate",
      header: "End Date",
      cell: (sub: SubscriptionListItem) => (
        <span className="text-muted-foreground">
          {formatDate(sub.endDate)}
        </span>
      ),
    },
    {
      key: "payments",
      header: "Payments",
      cell: (sub: SubscriptionListItem) => (
        <span className="text-muted-foreground">{sub._count.payments}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (sub: SubscriptionListItem) => (
        <Badge
          variant={
            SUBSCRIPTION_STATUS_VARIANTS[sub.status] ?? "secondary"
          }
        >
          {SUBSCRIPTION_STATUS_LABELS[sub.status] ?? sub.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={subscriptions}
      emptyTitle="No subscriptions"
      emptyDescription="Subscribe a business to a plan to get started."
    />
  );
}
