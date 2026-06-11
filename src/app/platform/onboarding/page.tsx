"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Circle,
  UserPlus,
} from "lucide-react";
import { getLeadsAction } from "@/server/actions/leads";
import { getOnboardingMetricsAction } from "@/server/actions/onboarding";
import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  status: string;
  assignedToId: string | null;
  createdAt: string;
  assignedTo: {
    id: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  } | null;
  _count: { activities: number; assignments: number };
}

interface OnboardingStep {
  step: string;
  label: string;
  count: number;
}

interface OnboardingMetrics {
  steps: OnboardingStep[];
  totalLeads: number;
}

const PIPELINE_STEPS = [
  { step: "LEAD_CREATED", label: "Lead Created", icon: UserPlus },
  { step: "CONTACTED", label: "Contacted", icon: Users },
  { step: "CONVERTED", label: "Converted", icon: CheckCircle2 },
  { step: "WORKSPACE_CREATED", label: "Workspace Created", icon: Building2 },
  { step: "BUSINESS_CREATED", label: "Business Created", icon: Building2 },
  { step: "OWNER_ASSIGNED", label: "Owner Assigned", icon: UserCheck },
  { step: "ACTIVE_CUSTOMER", label: "Active Customer", icon: Users },
];

export default function OnboardingPage() {
  const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, leadsData] = await Promise.all([
        getOnboardingMetricsAction(),
        getLeadsAction({ status: "NEW" }),
      ]);
      setMetrics(metricsData as unknown as OnboardingMetrics);
      setLeads(leadsData as unknown as Lead[]);
    } catch (error) {
      console.error("Failed to load onboarding data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "NEW":
      case "CONTACTED":
        return "secondary" as const;
      case "CONVERTED":
        return "success" as const;
      default:
        return "default" as const;
    }
  };

  const stepOrder: Record<string, number> = {
    LEAD_CREATED: 1,
    CONTACTED: 2,
    CONVERTED: 3,
    WORKSPACE_CREATED: 4,
    BUSINESS_CREATED: 5,
    OWNER_ASSIGNED: 6,
    TRAINING_COMPLETED: 7,
    ACTIVE_CUSTOMER: 8,
  };

  const sortedSteps = metrics?.steps
    ? [...metrics.steps].sort(
        (a, b) => (stepOrder[a.step] || 99) - (stepOrder[b.step] || 99),
      )
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Onboarding"
        description="Track and manage customer onboarding progress"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads Awaiting Setup
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.steps.find((s) => s.step === "LEAD_CREATED")
                  ?.count ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Workspaces to Create
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.steps.find((s) => s.step === "CONVERTED")?.count ??
                  0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.steps.find((s) => s.step === "ACTIVE_CUSTOMER")
                  ?.count ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : sortedSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No onboarding data available.
            </p>
          ) : (
            <div className="space-y-1">
              {sortedSteps.map((step, index) => {
                const pipelineItem = PIPELINE_STEPS.find(
                  (p) => p.step === step.step,
                );
                const Icon = pipelineItem?.icon || Circle;
                const isLast = index === sortedSteps.length - 1;

                return (
                  <div key={step.step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          step.count > 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex flex-1 items-center justify-between pb-6">
                      <div>
                        <div className="text-sm font-medium">
                          {step.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {step.step}
                        </div>
                      </div>
                      <Badge variant={step.count > 0 ? "default" : "secondary"}>
                        {step.count}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads in Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No leads in onboarding</p>
              <p className="text-sm text-muted-foreground">
                New leads will appear here for onboarding
              </p>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                <div className="col-span-3">Lead</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Current Step</div>
                <div className="col-span-2">Assigned To</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-1"></div>
              </div>
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                >
                  <div className="flex items-center gap-3 md:col-span-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(lead.firstName, lead.lastName)}
                    </div>
                    <div>
                      <Link
                        href={`/platform/leads/${lead.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {lead.firstName} {lead.lastName}
                      </Link>
                      {lead.businessName && (
                        <div className="text-xs text-muted-foreground">
                          {lead.businessName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground md:col-span-2">
                    {lead.email || lead.phone || "—"}
                  </div>
                  <div className="md:col-span-2">
                    <Badge variant={statusVariant(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="text-sm md:col-span-2">
                    {lead.assignedTo ? (
                      <span className="text-xs">
                        {lead.assignedTo.user.firstName}{" "}
                        {lead.assignedTo.user.lastName}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground md:col-span-2">
                    {formatDate(lead.createdAt)}
                  </div>
                  <div className="md:col-span-1">
                    <Link href={`/platform/leads/${lead.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
