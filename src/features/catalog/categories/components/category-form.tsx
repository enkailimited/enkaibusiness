"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createCategoryAction, updateCategoryAction } from "../actions";
import type { ActionResponse } from "@/types/relationships";

interface CategoryFormProps {
  mode: "create" | "edit";
  businessId: string;
  categories?: Array<{ id: string; name: string; parentId: string | null }>;
  initialData?: {
    id: string;
    name: string;
    parentId: string | null;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
  };
}

export function CategoryForm({ mode, businessId, categories, initialData }: CategoryFormProps) {
  const action = mode === "create"
    ? createCategoryAction.bind(null, businessId)
    : updateCategoryAction.bind(null, initialData?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

  const availableParents = (categories ?? []).filter(
    (c) => c.id !== initialData?.id,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Category" : "Edit Category"}</CardTitle>
        <CardDescription>
          {mode === "create" ? "Add a new product category" : "Update category details"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name}
              placeholder="e.g. Grains & Cereals"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={initialData?.parentId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            >
              <option value="">No parent (top level)</option>
              {availableParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min="0"
              defaultValue={initialData?.sortOrder ?? 0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description ?? ""}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              defaultValue={initialData?.imageUrl ?? ""}
              placeholder="https://example.com/category-image.jpg"
            />
          </div>

          {state?.errors && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {Object.values(state.errors).flat().join(", ")}
            </div>
          )}

          {state?.success === false && !state.errors && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : mode === "create" ? "Create Category" : "Update Category"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
