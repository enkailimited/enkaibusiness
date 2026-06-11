"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Phone,
  Mail,
  User,
  Calendar,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getLeadsAction } from "@/server/actions/leads";
import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import type { LeadFilters } from "@/server/services/lead-service";
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  source: string;
  status: string;
  notes: string | null;
  assignedToId: string | null;
  createdAt: string;
  assignedTo: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  _count: { activities: number; assignments: number };
}

const STATUS_TABS = [
  "ALL",
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
] as const;

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  NEW: "default",
  CONTACTED: "secondary",
  INTERESTED: "warning",
  DEMO: "warning",
  NEGOTIATION: "warning",
  CONVERTED: "success",
  LOST: "destructive",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const filters: LeadFilters = {};
      if (activeStatus !== "ALL") filters.status = activeStatus;
      if (searchQuery) filters.search = searchQuery;
      const data = await getLeadsAction(filters);
      setLeads(data as unknown as Lead[]);
    } catch (error) {
      console.error("Failed to load leads:", error);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, searchQuery]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Management"
        description="Track and manage leads"
      />

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLeads()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto rounded-lg border p-1">
            {STATUS_TABS.map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeStatus === status
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <User className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "No leads match the current filter"}
              </p>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Status</div>
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
                  <div className="flex flex-col text-sm md:col-span-2">
                    {lead.email && (
                      <span className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Badge variant={STATUS_VARIANTS[lead.status] || "outline"}>
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm md:col-span-2">
                    {lead.assignedTo ? (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                          {getInitials(
                            lead.assignedTo.user.firstName,
                            lead.assignedTo.user.lastName,
                          )}
                        </div>
                        <span className="text-xs">
                          {lead.assignedTo.user.firstName}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(lead.createdAt)}
                  </div>
                  <div className="flex justify-end md:col-span-1">
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
