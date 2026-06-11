"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Plus, Users } from "lucide-react";
import { getRolesAction } from "@/features/roles/actions";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: "PLATFORM" | "BUSINESS";
  isSystem: boolean;
  _count: { userRoles: number; rolePermissions: number };
};

export default function PlatformRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRolesAction()
      .then((data) => setRoles(data as Role[]))
      .finally(() => setLoading(false));
  }, []);

  const platformRoles = roles.filter((r) => r.scope === "PLATFORM");
  const businessRoles = roles.filter((r) => r.scope === "BUSINESS");

  const RoleList = ({ items }: { items: Role[] }) => (
    <div className="space-y-2">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))
        : items.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{role.name}</span>
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        System
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{role.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {role._count.userRoles} users
                </span>
                <span>{role._count.rolePermissions} perms</span>
              </div>
            </div>
          ))}
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Role Management"
        description={`${roles.length} roles across platform and business scopes`}
      >
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Role
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Platform Roles</CardTitle>
              <Badge variant="outline">{loading ? "—" : platformRoles.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RoleList items={platformRoles} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Business Roles</CardTitle>
              <Badge variant="outline">{loading ? "—" : businessRoles.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RoleList items={businessRoles} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
