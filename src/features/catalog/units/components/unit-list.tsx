"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listUnitsAction, deleteUnitAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UNIT_TYPE_LABELS, UNIT_TYPE_VARIANTS } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { UnitForm } from "./unit-form";
import type { UnitWithCount } from "../types";

interface UnitListProps {
  businessId: string;
}

export function UnitList({ businessId }: UnitListProps) {
  const [editItem, setEditItem] = useState<UnitWithCount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["units", businessId],
    queryFn: async () => {
      const result = await listUnitsAction(businessId);
      return (result ?? []) as UnitWithCount[];
    },
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteUnitAction(businessId, id);
      query.refetch();
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Units of Measure</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<UnitWithCount>
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.name}</span>
                  {r.isBase && <Badge variant="outline" className="text-xs">Base</Badge>}
                </div>
              ),
            },
            {
              key: "abbreviation",
              header: "Abbreviation",
              cell: (r) => <code className="text-xs font-mono">{r.abbreviation}</code>,
            },
            {
              key: "type",
              header: "Type",
              cell: (r) => (
                <Badge variant={UNIT_TYPE_VARIANTS[r.type] ?? "default"}>
                  {UNIT_TYPE_LABELS[r.type] ?? r.type}
                </Badge>
              ),
            },
            {
              key: "items",
              header: "Items",
              cell: (r) => r._count.catalogItems,
            },
            {
              key: "id" as never,
              header: "Actions",
              cell: (r) => (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditItem(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r.id)} disabled={deletingId === r.id}>
                    {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ),
            },
          ]}
          data={query.data ?? []}
          emptyTitle="No units of measure"
          emptyDescription="Add units like Pieces, Kilograms, or Liters to use in your catalog"
        />
      </CardContent>

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>Edit unit details</DialogDescription>
          </DialogHeader>
          {editItem && (
            <UnitForm
              mode="edit"
              businessId={businessId}
              initialData={{ id: editItem.id, name: editItem.name, abbreviation: editItem.abbreviation, type: editItem.type, isBase: editItem.isBase }}
              onSuccess={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deletingId) setDeleteTarget(null); }}
        title="Delete Unit"
        description="Are you sure you want to delete this unit of measure? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        loading={deletingId !== null}
      />
    </Card>
  );
}
