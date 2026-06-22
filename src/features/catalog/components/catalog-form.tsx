"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createCatalogItemAction, updateCatalogItemAction } from "../actions";
import { CATALOG_ITEM_TYPES, ITEM_TYPE_LABELS, DEFAULT_CURRENCY } from "../constants";
import type { ActionResponse } from "@/types/relationships";

interface CatalogFormProps {
  mode: "create" | "edit";
  businessId: string;
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    barcode: string | null;
    itemType: string;
    categoryId: string | null;
    brandId: string | null;
    unitId: string | null;
    price: number;
    costPrice: number | null;
    taxRate: number | null;
    currency: string;
    isService: boolean;
    trackStock: boolean;
    imageUrl: string | null;
    isActive: boolean;
  };
  categories?: Array<{ id: string; name: string }>;
  brands?: Array<{ id: string; name: string }>;
  units?: Array<{ id: string; name: string; abbreviation: string }>;
}

export function CatalogForm({ mode, businessId, initialData, categories, brands, units }: CatalogFormProps) {
  const action = mode === "create"
    ? createCatalogItemAction.bind(null, businessId)
    : updateCatalogItemAction.bind(null, initialData?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Catalog Item" : "Edit Catalog Item"}</CardTitle>
        <CardDescription>
          {mode === "create" ? "Add a new item to your catalog" : "Update item details"}
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
              placeholder="e.g. Organic Wheat Flour"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemType">Item Type</Label>
            <select
              id="itemType"
              name="itemType"
              defaultValue={initialData?.itemType ?? "PRODUCT"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              required
            >
              {CATALOG_ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ITEM_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={initialData?.sku ?? ""}
                placeholder="e.g. WF-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                defaultValue={initialData?.barcode ?? ""}
                placeholder="e.g. 123456789012"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={initialData?.categoryId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">No category</option>
                {(categories ?? []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <select
                id="brandId"
                name="brandId"
                defaultValue={initialData?.brandId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">No brand</option>
                {(brands ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit</Label>
              <select
                id="unitId"
                name="unitId"
                defaultValue={initialData?.unitId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">No unit</option>
                {(units ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialData?.price ?? 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialData?.costPrice ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={initialData?.currency ?? DEFAULT_CURRENCY}
                maxLength={3}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={initialData?.taxRate ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
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
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isService"
                defaultChecked={initialData?.isService ?? false}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Is a Service</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="trackStock"
                defaultChecked={initialData?.trackStock ?? true}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Track Stock</span>
            </label>
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
            {pending ? "Saving..." : mode === "create" ? "Create Item" : "Update Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
