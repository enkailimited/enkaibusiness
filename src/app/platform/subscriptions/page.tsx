"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getPlansAction,
  getSubscriptionsAction,
  getSubscriptionMetricsAction,
  createPlanAction,
  updateSubscriptionStatusAction,
} from "@/server/actions/subscriptions";
import {
  CreditCard,
  Users,
  AlertTriangle,
  DollarSign,
  Plus,
  RefreshCw,
  Calendar,
  Ban,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  createdAt: string;
};

type Subscription = {
  id: string;
  businessId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  plan: SubscriptionPlan;
  business: { id: string; businessName: string } | null;
};

type Metrics = {
  active: number;
  suspended: number;
  expired: number;
  totalRevenue: number;
};

const TAB_KEYS = ["overview", "plans", "subscriptions"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview",
  plans: "Plans",
  subscriptions: "Subscriptions",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  EXPIRED: "destructive",
  INACTIVE: "outline",
};

export default function PlatformSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [subStatusFilter, setSubStatusFilter] = useState("ALL");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", slug: "", description: "", amount: "", currency: "TZS", interval: "MONTHLY" });

  const loadMetrics = useCallback(async () => {
    try {
      const data = await getSubscriptionMetricsAction();
      setMetrics(data as unknown as Metrics);
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      const data = await getPlansAction();
      setPlans(data as unknown as SubscriptionPlan[]);
    } catch (e) {
      console.error("Failed to load plans:", e);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      const filters: Record<string, string> = {};
      if (subStatusFilter !== "ALL") filters.status = subStatusFilter;
      const data = await getSubscriptionsAction(filters);
      setSubscriptions(data as unknown as Subscription[]);
    } catch (e) {
      console.error("Failed to load subscriptions:", e);
    }
  }, [subStatusFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMetrics(), loadPlans(), loadSubscriptions()]).finally(() =>
      setLoading(false),
    );
  }, [loadMetrics, loadPlans, loadSubscriptions]);

  const handleCreatePlan = async () => {
    const fd = new FormData();
    fd.set("name", planForm.name);
    fd.set("slug", planForm.slug);
    fd.set("description", planForm.description);
    fd.set("amount", planForm.amount);
    fd.set("currency", planForm.currency);
    fd.set("interval", planForm.interval);
    await createPlanAction(null, fd);
    setPlanDialogOpen(false);
    setPlanForm({ name: "", slug: "", description: "", amount: "", currency: "TZS", interval: "MONTHLY" });
    loadPlans();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateSubscriptionStatusAction(id, status);
    loadSubscriptions();
  };

  const renderTabNav = () => (
    <div className="flex gap-1 overflow-x-auto rounded-lg border p-1">
      {TAB_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          {TAB_LABELS[key]}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Subscriptions" description="Manage customer subscriptions" />
        {renderTabNav()}
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Manage customer subscriptions" />
      {renderTabNav()}

      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.active ?? "--"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Ban className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.suspended ?? "--"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.expired ?? "--"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? new Intl.NumberFormat().format(metrics.totalRevenue) : "--"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "plans" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Subscription Plans</CardTitle>
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Subscription Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="Premium Plan"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={planForm.slug}
                      onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                      placeholder="premium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        value={planForm.amount}
                        onChange={(e) => setPlanForm({ ...planForm, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <Select
                        value={planForm.currency}
                        onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                        options={[
                          { value: "TZS", label: "TZS" },
                          { value: "USD", label: "USD" },
                        ]}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Interval</label>
                    <Select
                      value={planForm.interval}
                      onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })}
                      options={[
                        { value: "MONTHLY", label: "Monthly" },
                        { value: "YEARLY", label: "Yearly" },
                        { value: "QUARTERLY", label: "Quarterly" },
                      ]}
                    />
                  </div>
                  <Button onClick={handleCreatePlan} className="w-full">
                    Create Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <CreditCard className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No plans yet</p>
                <p className="text-sm text-muted-foreground">Create your first subscription plan</p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Interval</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Created</div>
                </div>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                  >
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.slug}</p>
                    </div>
                    <div className="text-sm md:col-span-2">
                      {new Intl.NumberFormat().format(plan.amount)} {plan.currency}
                    </div>
                    <div className="text-sm md:col-span-2">{plan.interval}</div>
                    <div className="md:col-span-2">
                      <Badge variant={STATUS_VARIANTS[plan.status] || "outline"}>
                        {plan.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-3">
                      <Calendar className="h-3 w-3" />
                      {formatDate(plan.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "subscriptions" && (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Select
                  value={subStatusFilter}
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "SUSPENDED", label: "Suspended" },
                    { value: "EXPIRED", label: "Expired" },
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    Promise.all([loadMetrics(), loadPlans(), loadSubscriptions()]).finally(() =>
                      setLoading(false),
                    );
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {subscriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No subscriptions found</p>
                <p className="text-sm text-muted-foreground">
                  {subStatusFilter !== "ALL"
                    ? "No subscriptions match the current filter"
                    : "No subscriptions yet"}
                </p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-3">Business</div>
                  <div className="col-span-2">Plan</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Start Date</div>
                  <div className="col-span-2">End Date</div>
                  <div className="col-span-1"></div>
                </div>
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                  >
                    <div className="text-sm font-medium md:col-span-3">
                      {sub.business?.businessName ?? "Unknown"}
                    </div>
                    <div className="text-sm md:col-span-2">{sub.plan.name}</div>
                    <div className="md:col-span-2">
                      <Badge variant={STATUS_VARIANTS[sub.status] || "outline"}>
                        {sub.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(sub.startDate)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-2">
                      {sub.endDate ? (
                        <>
                          <Calendar className="h-3 w-3" />
                          {formatDate(sub.endDate)}
                        </>
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex justify-end gap-1 md:col-span-1">
                      {sub.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStatusChange(sub.id, "SUSPENDED")}
                          title="Suspend"
                        >
                          <Ban className="h-4 w-4 text-yellow-500" />
                        </Button>
                      )}
                      {sub.status === "SUSPENDED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStatusChange(sub.id, "ACTIVE")}
                          title="Activate"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
