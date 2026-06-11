"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createProductAction, updateProductAction } from "../actions";
import { ProductVariantForm } from "./product-variant-form";
import type { ProductWithVariants } from "../types";

interface ProductFormProps {
  businessId: string;
  product?: ProductWithVariants;
  onSuccess?: () => void;
}

export function ProductForm({ businessId, product, onSuccess }: ProductFormProps) {
  const [variantCount, setVariantCount] = useState(product?.variants?.length ?? 0);
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  const addVariant = () => setVariantCount((c) => c + 1);
  const removeVariant = (index: number) => setVariantCount((c) => Math.max(0, c - 1));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Add Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="itemType" value="PRODUCT" />
          <input type="hidden" name="isService" value="false" />

          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name ?? ""}
              placeholder="Product name"
              required
            />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={product?.sku ?? ""}
                placeholder="SKU-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                defaultValue={product?.barcode ?? ""}
                placeholder="Barcode"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                defaultValue={product?.category ?? ""}
                placeholder="Category"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                name="unit"
                defaultValue={product?.unit ?? ""}
                placeholder="pcs, kg, ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product ? Number(product.price) : ""}
                placeholder="0.00"
                required
              />
              {state?.errors?.price && (
                <p className="text-sm text-destructive">{state.errors.price[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.costPrice ? Number(product.costPrice) : ""}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder="Product description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              defaultValue={product?.imageUrl ?? ""}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="trackStock"
              name="trackStock"
              defaultChecked={product?.trackStock ?? true}
              value="true"
            />
            <Label htmlFor="trackStock">Track stock</Label>
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          {!product && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Variants</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    Add Variant
                  </Button>
                </div>
                {Array.from({ length: variantCount }).map((_, i) => (
                  <ProductVariantForm key={i} index={i} onRemove={removeVariant} />
                ))}
              </div>
            </>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
