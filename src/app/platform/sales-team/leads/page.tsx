"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  PhoneCall,
  Users,
  TrendingUp,
  Target,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import type { LeadWithAssignments, LeadMetrics } from "@/features/leads/types";
import {
  getLeadsAction,
  deleteLeadAction,
  updateLeadStatusAction,
  getLeadMetricsAction,
} from "@/features/leads/actions";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_OPTIONS,
} from "@/features/leads/constants";
import { LeadForm } from "@/features/leads/components/lead-form";

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "CONVERTED": return "default" as const;
    case "LOST": return "destructive" as const;
    case "NEGOTIATION": return "warning" as const;
    default: return "secondary" as const;
  }
};

export default function SalesTeamLeadsPage() {
  const [leads, setLeads] = useState<LeadWithAssignments[]>([]);
  const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsData, metricsData] = await Promise.all([
        getLeadsAction({ search: search || undefined, status: statusFilter || undefined }),
        getLeadMetricsAction(),
      ]);
      setLeads(leadsData ?? []);
      setMetrics(metricsData ?? null);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(leadId: string, status: string) {
    await updateLeadStatusAction(leadId, status);
    fetchData();
  }

  async function handleDelete(leadId: string) {
    if (!confirm("Delete this lead permanently?")) return;
    await deleteLeadAction(leadId);
    fetchData();
  }

  const metricCards = metrics ? [
    { label: "Total Leads", value: metrics.totalLeads, icon: Users, color: "text-blue-600" },
    { label: "Converted", value: metrics.totalConverted, icon: TrendingUp, color: "text-emerald-600" },
    { label: "Conversion Rate", value: `${metrics.conversionRate.toFixed(1)}%`, icon: Target, color: "text-violet-600" },
    { label: "This Month", value: metrics.convertedThisMonth, icon: PhoneCall, color: "text-amber-600" },
  ] : [];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Leads Management"
        description="Track, manage, and convert your leads."
      />

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{m.label}</CardTitle>
              <m.icon className={"h-4 w-4 " + m.color} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="w-[140px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === "all" ? "" : e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            {LEAD_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-2">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription className="sr-only">Create a new lead</DialogDescription>
            </DialogHeader>
            <LeadForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <PhoneCall className="mb-3 h-10 w-10" />
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-xs">Create your first lead to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {leads.map((lead) => (
                <div key={lead.id}>
                  <div
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lead.firstName} {lead.lastName}
                      </p>
                      {lead.businessName && (
                        <p className="text-xs text-muted-foreground truncate">{lead.businessName}</p>
                      )}
                    </div>

                    <div className="hidden sm:block text-xs text-muted-foreground">
                      {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
                    </div>

                    <Badge variant={statusBadgeVariant(lead.status)}>
                      {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                    </Badge>

                    <div className="text-xs text-muted-foreground w-20 text-right hidden md:block">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>

                    {expandedId === lead.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {/* Expanded row */}
                  {expandedId === lead.id && (
                    <div className="border-t bg-muted/20 px-4 py-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {lead.email && (
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium truncate">{lead.email}</p>
                          </div>
                        )}
                        {lead.phone && (
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="font-medium">{lead.phone}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Source</p>
                          <p className="font-medium">{LEAD_SOURCE_LABELS[lead.source] ?? lead.source}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Assigned To</p>
                          <p className="font-medium">
                            {lead.assignedTo
                              ? `${lead.assignedTo.user.firstName} ${lead.assignedTo.user.lastName}`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {lead.notes && (
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-muted-foreground">{lead.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
                        {LEAD_STATUS_OPTIONS.map((opt) => (
                          <Button
                            key={opt.value}
                            variant={lead.status === opt.value ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleStatusChange(lead.id, opt.value)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                          onClick={() => handleDelete(lead.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
