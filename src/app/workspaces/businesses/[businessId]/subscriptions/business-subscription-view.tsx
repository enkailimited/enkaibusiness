"use client";

import { useEffect, useState } from "react";
import { listSubscriptionsAction } from "@/features/subscriptions/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_VARIANTS,
  SUBSCRIPTION_INTERVAL_LABELS,
} from "@/features/subscriptions/constants";
import type { SubscriptionListItem } from "@/features/subscriptions/types";

interface Props {
  businessId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-TZ", { year: "numeric", month: "short", day: "numeric" });
}

export function BusinessSubscriptionView({ businessId }: Props) {
  const [subscription, setSubscription] = useState<SubscriptionListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSubscriptionsAction({ businessId }).then((result) => {
      if (result.data && result.data.length > 0) {
        setSubscription(result.data[0]);
      }
      setLoading(false);
    });
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No active subscription found for this business.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {subscription.plan.name}
            <Badge variant={SUBSCRIPTION_STATUS_VARIANTS[subscription.status] ?? "secondary"}>
              {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            {formatCurrency(subscription.plan.amount)} /{" "}
            {SUBSCRIPTION_INTERVAL_LABELS[subscription.plan.interval]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Date</span>
            <span className="font-medium">{formatDate(subscription.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End Date</span>
            <span className="font-medium">{formatDate(subscription.endDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payments</span>
            <span className="font-medium">{subscription._count.payments}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
