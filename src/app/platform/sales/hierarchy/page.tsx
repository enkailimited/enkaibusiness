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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
  Layers,
} from "lucide-react";
import {
  getSalesHierarchyAction,
  createSalesHierarchyAction,
  deleteSalesHierarchyAction,
} from "@/server/actions/sales";

interface HierarchyLevel {
  id: string;
  level: number;
  title: string;
  slug: string;
  description: string | null;
}

export default function SalesHierarchyPage() {
  const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSalesHierarchyAction();
      setHierarchy(data as unknown as HierarchyLevel[]);
    } catch (err) {
      console.error("Failed to load hierarchy:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newSlug.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("title", newTitle);
      formData.set("slug", newSlug);
      formData.set("level", String(hierarchy.length + 1));
      if (newDescription) formData.set("description", newDescription);

      const result = await createSalesHierarchyAction(null, formData);
      if (result.success) {
        setShowAddForm(false);
        setNewTitle("");
        setNewSlug("");
        setNewDescription("");
        await loadData();
      } else {
        setError(result.message || "Failed to create level");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSalesHierarchyAction(id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleteConfirm(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...hierarchy];
    const a = items[index] as HierarchyLevel;
    const b = items[index - 1] as HierarchyLevel;
    items[index] = b;
    items[index - 1] = a;
    setHierarchy(items.map((item, i) => ({ ...item, level: i + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === hierarchy.length - 1) return;
    const items = [...hierarchy];
    const a = items[index] as HierarchyLevel;
    const b = items[index + 1] as HierarchyLevel;
    items[index] = b;
    items[index + 1] = a;
    setHierarchy(items.map((item, i) => ({ ...item, level: i + 1 })));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Hierarchy"
        description="Manage sales team hierarchy levels"
      >
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Level
        </Button>
      </PageHeader>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Hierarchy Level</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g. National Manager"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setNewSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    );
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  placeholder="e.g. national-manager"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleAdd} disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : "Create Level"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hierarchy Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : hierarchy.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Layers className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No hierarchy levels</p>
              <p className="text-sm text-muted-foreground">
                Create your first hierarchy level to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {hierarchy.map((level, index) => (
                <div
                  key={level.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {level.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {level.title}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {level.slug}
                      </Badge>
                    </div>
                    {level.description && (
                      <div className="text-xs text-muted-foreground">
                        {level.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === hierarchy.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteConfirm(level.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Hierarchy Level"
        description="Delete this hierarchy level? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  );
}
