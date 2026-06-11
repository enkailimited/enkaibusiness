import { getPermissions } from "../services/permission-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import type { Permission } from "@/types/models";

interface PermissionListProps {
  module?: string;
}

export async function PermissionList({ module }: PermissionListProps) {
  const permissions = await getPermissions(module);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<Permission>
          columns={[
            { key: "name", header: "Name", cell: (p) => <span className="font-medium">{p.name}</span> },
            { key: "slug", header: "Slug", cell: (p) => <code className="text-xs">{p.slug}</code> },
            { key: "module", header: "Module", cell: (p) => <Badge variant="secondary">{p.module}</Badge> },
            { key: "action", header: "Action", cell: (p) => <Badge>{p.action}</Badge> },
            { key: "description", header: "Description", cell: (p) => p.description ?? "—" },
          ]}
          data={permissions}
          emptyTitle="No permissions found"
          emptyDescription={module ? `No permissions for module "${module}"` : "No permissions have been created yet"}
        />
      </CardContent>
    </Card>
  );
}
