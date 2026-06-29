"use client";

import { useState } from "react";
import { deleteCategoryAction, updateCategoryAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2, Archive, RotateCcw } from "lucide-react";
import { CategoryForm } from "./category-form";
import type { CategoryWithChildren } from "../types";

interface CategoryListProps {
  categories: CategoryWithChildren[];
  businessId: string;
  categoryOptions?: Array<{ id: string; name: string; parentId: string | null }>;
  onRefresh?: () => void;
}

function CategoryTreeItem({
  category,
  depth = 0,
  onEdit,
  onDelete,
  onToggle,
  deletingId,
  togglingId,
}: {
  category: CategoryWithChildren;
  depth?: number;
  onEdit: (cat: CategoryWithChildren) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  deletingId: string | null;
  togglingId: string | null;
}) {
  return (
    <>
      <tr className="border-b transition-colors hover:bg-muted/50">
        <td className="px-4 py-3 text-sm" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {depth > 0 && (
              <span className="text-xs text-muted-foreground">└─</span>
            )}
            <span className={depth > 0 ? "text-sm" : "font-medium"}>
              {category.name}
            </span>
            {!category.isActive && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {category._count?.catalogItems ?? 0} items
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {category.sortOrder}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {category.description ?? "—"}
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {category.isActive ? (
              <Button variant="ghost" size="sm" onClick={() => onToggle(category.id, false)} disabled={togglingId === category.id}>
                {togglingId === category.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5 text-amber-600" />}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => onToggle(category.id, true)} disabled={togglingId === category.id}>
                {togglingId === category.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 text-green-600" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)} disabled={deletingId === category.id}>
              {deletingId === category.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </td>
      </tr>
      {category.children.map((child) => (
        <CategoryTreeItem key={child.id} category={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} deletingId={deletingId} togglingId={togglingId} />
      ))}
    </>
  );
}

export function CategoryList({ categories, businessId, categoryOptions, onRefresh }: CategoryListProps) {
  const [editItem, setEditItem] = useState<CategoryWithChildren | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCategoryAction(businessId, id);
      onRefresh?.();
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
      await updateCategoryAction(id, null, fd);
      onRefresh?.();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sort Order</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <CategoryTreeItem key={cat.id} category={cat} onEdit={setEditItem} onDelete={(id) => setDeleteTarget(id)} onToggle={handleToggleActive} deletingId={deletingId} togglingId={togglingId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Edit category details</DialogDescription>
          </DialogHeader>
          {editItem && (
            <CategoryForm
              mode="edit"
              businessId={businessId}
              categories={categoryOptions}
              initialData={{ id: editItem.id, name: editItem.name, description: editItem.description, sortOrder: editItem.sortOrder, parentId: editItem.parentId, imageUrl: editItem.imageUrl }}
              onSuccess={() => { setEditItem(null); onRefresh?.(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deletingId) setDeleteTarget(null); }}
        title="Delete Category"
        description="Are you sure you want to delete this category? Items in this category will not be deleted."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        loading={deletingId !== null}
      />
    </Card>
  );
}
