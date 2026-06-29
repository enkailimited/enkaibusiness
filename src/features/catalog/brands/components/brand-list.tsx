"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listBrandsAction, deleteBrandAction, updateBrandAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Loader2, Archive, RotateCcw } from "lucide-react";
import { BrandForm } from "./brand-form";

interface BrandListProps {
  businessId: string;
}

export function BrandList({ businessId }: BrandListProps) {
  const [editItem, setEditItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["brands", businessId],
    queryFn: async () => {
      const result = await listBrandsAction(businessId);
      return result ?? [];
    },
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteBrandAction(businessId, id);
      query.refetch();
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    setTogglingId(id);
    try {
      const fd = new FormData();
      fd.set("isActive", String(active));
      await updateBrandAction(id, null, fd);
      query.refetch();
    } finally {
      setTogglingId(null);
    }
  };

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const brands = query.data ?? [];

  if (brands.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No brands created yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand: any) => (
          <Card key={brand.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {brand.logoUrl ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="h-10 w-10 rounded object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      <span className="text-lg font-bold text-muted-foreground">
                        {brand.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{brand.name}</h3>
                      {!brand.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {brand.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {brand.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {brand._count.catalogItems} item{brand._count.catalogItems !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditItem(brand)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {brand.isActive ? (
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(brand.id, false)} disabled={togglingId === brand.id}>
                      {togglingId === brand.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5 text-amber-600" />}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(brand.id, true)} disabled={togglingId === brand.id}>
                      {togglingId === brand.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 text-green-600" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(brand.id)} disabled={deletingId === brand.id}>
                    {deletingId === brand.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Edit brand details</DialogDescription>
          </DialogHeader>
          {editItem && (
            <BrandForm
              mode="edit"
              businessId={businessId}
              initialData={{ id: editItem.id, name: editItem.name, description: editItem.description, logoUrl: editItem.logoUrl }}
              onSuccess={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deletingId) setDeleteTarget(null); }}
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        loading={deletingId !== null}
      />
    </>
  );
}
