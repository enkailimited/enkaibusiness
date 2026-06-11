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
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Users,
  Target,
} from "lucide-react";
import {
  getSalesProfilesAction,
  getSalesHierarchyAction,
} from "@/server/actions/sales";
import { formatDate, getInitials } from "@/lib/utils";

interface SalesProfile {
  id: string;
  userId: string;
  phone: string | null;
  region: string | null;
  status: string;
  hierarchyId: string | null;
  managerId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
  };
  hierarchy: { id: string; title: string; slug: string; level: number } | null;
  manager: {
    id: string;
    user: { id: string; firstName: string; lastName: string };
  } | null;
  _count: { subordinates: number; leads: number };
}

interface HierarchyLevel {
  id: string;
  level: number;
  title: string;
  slug: string;
  description: string | null;
}

export default function SalesProfilesPage() {
  const [profiles, setProfiles] = useState<SalesProfile[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [hierarchyFilter, setHierarchyFilter] = useState<string>("ALL");
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesData, hierarchyData] = await Promise.all([
        getSalesProfilesAction(),
        getSalesHierarchyAction(),
      ]);
      setProfiles(profilesData as SalesProfile[]);
      setHierarchy(hierarchyData as HierarchyLevel[]);
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      `${p.user.firstName} ${p.user.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      p.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || p.status === statusFilter;

    const matchesHierarchy =
      hierarchyFilter === "ALL" || p.hierarchyId === hierarchyFilter;

    return matchesSearch && matchesStatus && matchesHierarchy;
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success" as const;
      case "INACTIVE":
        return "secondary" as const;
      case "SUSPENDED":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Profiles"
        description="Manage your sales team members"
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or region..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={hierarchyFilter}
              onChange={(e) => setHierarchyFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              {hierarchy.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No profiles found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "ALL" || hierarchyFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "No sales profiles exist yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProfiles.map((profile) => {
                const isExpanded = expandedProfile === profile.id;
                return (
                  <div
                    key={profile.id}
                    className="rounded-lg border transition-colors hover:bg-accent/50"
                  >
                    <button
                      onClick={() =>
                        setExpandedProfile(isExpanded ? null : profile.id)
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(
                          profile.user.firstName,
                          profile.user.lastName,
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {profile.user.firstName} {profile.user.lastName}
                          </span>
                          <Badge
                            variant={statusVariant(profile.status)}
                            className="text-[10px]"
                          >
                            {profile.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {profile.hierarchy?.title ?? "No role"} &middot;{" "}
                          {profile.region ?? "No region"}
                        </div>
                      </div>
                      <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {profile._count.leads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {profile._count.subordinates}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="border-t px-4 py-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.phone ?? "No phone"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.region ?? "No region"}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {profile._count.leads} leads
                          </Badge>
                          <Badge variant="outline">
                            {profile._count.subordinates} subordinates
                          </Badge>
                          {profile.manager && (
                            <Badge variant="outline">
                              Manager: {profile.manager.user.firstName}{" "}
                              {profile.manager.user.lastName}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            Created {formatDate(profile.user.id ? "" : "")}
                          </Badge>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit Profile
                          </Button>
                          <Button variant="outline" size="sm">
                            View Team
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
