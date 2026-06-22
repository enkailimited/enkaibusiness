"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryForm } from "@/features/catalog/categories/components/category-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { listCategoriesAction } from "@/features/catalog/categories/actions";
import type { CategoryWithChildren } from "@/features/catalog/categories/types";

function flattenCategories(categories: CategoryWithChildren[]): Array<{ id: string; name: string; parentId: string | null }> {
  const result: Array<{ id: string; name: string; parentId: string | null }> = [];
  function walk(list: CategoryWithChildren[]) {
    for (const c of list) {
      result.push({ id: c.id, name: c.name, parentId: c.parentId });
      if (c.children) walk(c.children);
    }
  }
  walk(categories);
  return result;
}

export default function CategoriesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCategoriesAction(businessId);
      setCategories(result ?? []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Categories" description="Organize products into categories">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription className="sr-only">Add a new product category</DialogDescription>
            </DialogHeader>
            <CategoryForm
              mode="create"
              businessId={businessId}
              categories={flattenCategories(categories)}
              onSuccess={() => {
                setDialogOpen(false);
                fetchData();
              }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CategoryList categories={categories} />
      )}
    </div>
  );
}
