import { requireAuth } from "@/server/auth";
import { getHierarchyLevels } from "../services/hierarchy-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { HierarchyWithCount } from "../types";
import { deleteHierarchyLevelAction } from "../actions";

export async function HierarchyList() {
  await requireAuth();
  const levels = await getHierarchyLevels();

  const columns = [
    {
      key: "level",
      header: "Level",
      cell: (item: HierarchyWithCount) => (
        <span className="font-mono text-sm">{item.level}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      cell: (item: HierarchyWithCount) => (
        <span className="font-medium">{item.title}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      cell: (item: HierarchyWithCount) => (
        <Badge variant="secondary" className="font-mono">{item.slug}</Badge>
      ),
    },
    {
      key: "profiles",
      header: "Profiles",
      cell: (item: HierarchyWithCount) => (
        <span className="text-muted-foreground">{item._count?.profiles ?? 0}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (item: HierarchyWithCount) => (
        <span className="text-muted-foreground">{item.description ?? "—"}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={levels}
      emptyTitle="No hierarchy levels found"
      emptyDescription="Create your first sales hierarchy level to get started."
    />
  );
}
