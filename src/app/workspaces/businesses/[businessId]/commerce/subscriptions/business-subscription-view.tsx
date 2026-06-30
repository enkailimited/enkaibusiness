"use client";

import { useEffect, useState, useCallback } from "react";
import { listSubscriptionsAction } from "@/features/subscriptions/actions";
import { getBusinessPricingSettingsAction, toggleQrOrderingAction } from "@/features/businesses/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
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
  const [pricing, setPricing] = useState<{
    qrOrderingEnabled: boolean;
    dailyPrice: number | null;
    setupFee: number | null;
    businessSize: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subResult, pricingResult] = await Promise.all([
        listSubscriptionsAction({ businessId }),
        getBusinessPricingSettingsAction(businessId),
      ]);
      if (subResult && subResult.length > 0) {
        setSubscription(subResult[0]);
      }
      setPricing(pricingResult);
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (enable: boolean) => {
    setToggling(true);
    try {
      const result = await toggleQrOrderingAction(businessId, enable);
      if (result.success) {
        await fetchData();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    } finally {
      setToggling(false);
    }
  };

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
          {pricing?.businessSize && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Size</span>
              <span className="font-medium capitalize">{pricing.businessSize}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; Features</CardTitle>
          <CardDescription>Current subscription pricing and add-ons</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Price</span>
              <span className="font-medium">
                {pricing?.dailyPrice ? formatCurrency(pricing.dailyPrice) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Setup Fee</span>
              <span className="font-medium">
                {pricing?.setupFee ? formatCurrency(pricing.setupFee) : "—"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">QR Ordering</p>
                <p className="text-xs text-muted-foreground">
                  Allow customers to scan QR codes and view your menu
                </p>
              </div>
              <Switch
                checked={pricing?.qrOrderingEnabled ?? false}
                onCheckedChange={handleToggle}
                disabled={toggling}
              />
            </div>
            {pricing?.qrOrderingEnabled && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>• 20% daily price surcharge applied</p>
                <p>• QR sticker printing fee included in setup fee</p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={toggling}
            asChild
          >
            <a href={`/workspaces/businesses/${businessId}/commerce/wallet`}>
              View Wallet
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
