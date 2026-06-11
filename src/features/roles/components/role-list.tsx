import { getRoles } from "../services/role-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import type { RoleWithUserCount } from "../types";

interface RoleListProps {
  scope?: "PLATFORM" | "BUSINESS";
}

export async function RoleList({ scope }: RoleListProps) {
  const roles = await getRoles(scope) as RoleWithUserCount[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<RoleWithUserCount>
          columns={[
            { key: "name", header: "Name", cell: (r) => (
              <span className="font-medium">
                {r.name}
                {r.isSystem && <Badge variant="secondary" className="ml-2">System</Badge>}
              </span>
            )},
            { key: "slug", header: "Slug", cell: (r) => <code className="text-xs">{r.slug}</code> },
            { key: "scope", header: "Scope", cell: (r) => <Badge variant={r.scope === "PLATFORM" ? "default" : "outline"}>{r.scope}</Badge> },
            { key: "users", header: "Users", cell: (r) => r._count.userRoles },
            { key: "description", header: "Description", cell: (r) => r.description ?? "—" },
          ]}
          data={roles}
          emptyTitle="No roles found"
          emptyDescription={scope ? `No ${scope.toLowerCase()} roles` : "No roles have been created yet"}
        />
      </CardContent>
    </Card>
  );
}
