"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, Loader2, Archive, RotateCcw } from "lucide-react";
import { ITEM_TYPE_LABELS, ITEM_TYPE_VARIANTS } from "../constants";
import { CatalogForm } from "./catalog-form";
import { deleteCatalogItemAction, updateCatalogItemAction, checkItemHasHistoryAction } from "../actions";
import type { CatalogItemWithRelations } from "../types";

interface CatalogListProps {
  items: CatalogItemWithRelations[];
  businessId: string;
  categories?: Array<{ id: string; name: string }>;
  brands?: Array<{ id: string; name: string }>;
  units?: Array<{ id: string; name: string; abbreviation: string }>;
  commerceCatalogTypes?: string[];
}

export function CatalogList({ items, businessId, categories, brands, units, commerceCatalogTypes }: CatalogListProps) {
  const { toast } = useToast();
  const [editItem, setEditItem] = useState<CatalogItemWithRelations | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    items.forEach((item) => {
      checkItemHasHistoryAction(item.id).then(({ hasHistory }) => {
        setHistoryMap((prev) => ({ ...prev, [item.id]: hasHistory }));
      });
    });
  }, [items]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteCatalogItemAction(businessId, id);
      if (!result.success) {
        toast({ title: "Cannot delete", description: result.message, variant: "destructive" });
      }
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleArchive = async (id: string) => {
    setTogglingId(id);
    try {
      const fd = new FormData();
      fd.set("isActive", "false");
      await updateCatalogItemAction(id, null, fd);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    setTogglingId(id);
    try {
      const fd = new FormData();
      fd.set("isActive", "true");
      await updateCatalogItemAction(id, null, fd);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <DataTable<CatalogItemWithRelations>
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (r) => (
              <div>
                <span className="font-medium">{r.name}</span>
                {r.sku && (
                  <span className="ml-2 text-xs text-muted-foreground">SKU: {r.sku}</span>
                )}
              </div>
            ),
          },
          {
            key: "itemType",
            header: "Type",
            cell: (r) => (
              <Badge variant={ITEM_TYPE_VARIANTS[r.itemType] ?? "default"}>
                {ITEM_TYPE_LABELS[r.itemType] ?? r.itemType}
              </Badge>
            ),
          },
          {
            key: "category",
            header: "Category",
            cell: (r) => r.category?.name ?? "—",
          },
          {
            key: "isActive",
            header: "Status",
            cell: (r) => (
              <Badge variant={r.isActive ? "success" : "secondary"}>
                {r.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "id" as never,
            header: "Actions",
            cell: (r) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditItem(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {r.isActive ? (
                  <Button variant="ghost" size="sm" onClick={() => handleArchive(r.id)} disabled={togglingId === r.id}>
                    {togglingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5 text-amber-600" />}
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleRestore(r.id)} disabled={togglingId === r.id}>
                    {togglingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 text-green-600" />}
                  </Button>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(r.id)}
                          disabled={deletingId === r.id || historyMap[r.id]}
                        >
                          {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {historyMap[r.id] && (
                      <TooltipContent>
                        <p>Cannot delete item with transaction history</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            ),
          },
        ]}
        data={items}
        emptyTitle="No catalog items"
        emptyDescription="Add your first catalog item to get started"
      />

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Catalog Item</DialogTitle>
            <DialogDescription>Edit catalog item details</DialogDescription>
          </DialogHeader>
          {editItem && (
            <CatalogForm
              mode="edit"
              businessId={businessId}
              categories={categories}
              brands={brands}
              units={units}
              commerceCatalogTypes={commerceCatalogTypes}
              initialData={{
                id: editItem.id,
                name: editItem.name,
                description: editItem.description,
                sku: editItem.sku,
                barcode: editItem.barcode,
                itemType: editItem.itemType,
                categoryId: editItem.categoryId,
                brandId: editItem.brandId,
                unitId: editItem.unitId,
                isService: editItem.isService,
                trackStock: editItem.trackStock,
                imageUrl: editItem.imageUrl,
                isActive: editItem.isActive,
                variants: editItem.variants?.map((v) => ({
                  id: v.id,
                  name: v.name,
                  sku: v.sku,
                  barcode: v.barcode,
                  imageUrl: v.imageUrl,
                  sortOrder: v.sortOrder,
                })),
              }}
              onSuccess={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deletingId) setDeleteTarget(null); }}
        title="Delete Catalog Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        loading={deletingId !== null}
      />
    </>
  );
}
