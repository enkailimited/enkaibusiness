"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FormStepper } from "@/components/ui/form-stepper";
import { createProductAction, updateProductAction } from "../actions";
import { ProductVariantForm } from "./product-variant-form";
import type { ProductWithVariants } from "../types";
import { ChevronLeft, ChevronRight, Package, DollarSign, FileText } from "lucide-react";

interface ProductFormProps {
  businessId: string;
  product?: ProductWithVariants;
  onSuccess?: () => void;
}

const STEPS = [
  { title: "Basic Info", description: "Name, SKU, and product category" },
  { title: "Pricing", description: "Selling and cost price" },
  { title: "Details", description: "Description, image and variants" },
];

export function ProductForm({ businessId, product, onSuccess }: ProductFormProps) {
  const [step, setStep] = useState(0);
  const [variantCount, setVariantCount] = useState(product?.variants?.length ?? 0);
  const formActionRef = useMemo(
    () => (product ? updateProductAction.bind(null, product.id) : createProductAction),
    [product],
  );
  const [state, formAction, pending] = useActionState(formActionRef, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  const addVariant = () => setVariantCount((c) => c + 1);
  const removeVariant = (index: number) => setVariantCount((c) => Math.max(0, c - 1));

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="itemType" value="PRODUCT" />
          <input type="hidden" name="isService" value="false" />

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Basic Info</h3>
                  <p className="text-sm text-gray-500">Name, SKU, and product category</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={product?.name ?? ""}
                    placeholder="e.g. Wheat Bread"
                    required
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {state?.errors?.name && (
                    <p className="text-sm text-red-500">{state.errors.name[0]}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-sm font-medium">
                      SKU <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="sku"
                      name="sku"
                      defaultValue={product?.sku ?? ""}
                      placeholder="e.g. SKU-001"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-sm font-medium">
                      Barcode <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="barcode"
                      name="barcode"
                      defaultValue={product?.barcode ?? ""}
                      placeholder="e.g. 1234567890"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="category"
                      name="category"
                      defaultValue={product?.category ?? ""}
                      placeholder="e.g. Beverages"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium">
                      Unit <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="unit"
                      name="unit"
                      defaultValue={product?.unit ?? ""}
                      placeholder="pcs, kg, ltr"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pricing</h3>
                  <p className="text-sm text-gray-500">Selling and cost price</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Selling Price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={product ? Number(product.price) : ""}
                      placeholder="0.00"
                      required
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {state?.errors?.price && (
                      <p className="text-sm text-red-500">{state.errors.price[0]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice" className="text-sm font-medium">
                      Cost Price <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="costPrice"
                      name="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={product?.costPrice ? Number(product.costPrice) : ""}
                      placeholder="0.00"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 2 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Details</h3>
                  <p className="text-sm text-gray-500">Description, image and variants</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={product?.description ?? ""}
                    className="flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Product description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-sm font-medium">
                    Image URL <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    defaultValue={product?.imageUrl ?? ""}
                    placeholder="https://example.com/image.jpg"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50">
                  <Switch
                    id="trackStock"
                    name="trackStock"
                    defaultChecked={product?.trackStock ?? true}
                    value="true"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Track Stock</span>
                    <p className="text-xs text-gray-500">Enable to track product stock quantities</p>
                  </div>
                </label>
                {!product && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Variants</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                        Add Variant
                      </Button>
                    </div>
                    {Array.from({ length: variantCount }).map((_, i) => (
                      <ProductVariantForm key={i} index={i} onRemove={removeVariant} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {state?.message && !state?.success && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              <p className="font-medium">{state.message}</p>
              {state.errors && (
                <ul className="mt-2 list-inside list-disc text-xs">
                  {Object.values(state.errors).flat().map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {state?.success && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">
              <p className="font-medium">{state.message}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="h-11 rounded-xl border-gray-200 px-6"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {pending ? "Saving..." : product ? "Update Product" : "Save Product"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
