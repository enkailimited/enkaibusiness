"use client";

import { useState, useActionState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { ImageUploader } from "@/components/upload/image-uploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CategoryForm } from "@/features/catalog/categories/components/category-form";
import { BrandForm } from "@/features/catalog/brands/components/brand-form";
import { UnitForm } from "@/features/catalog/units/components/unit-form";
import { listCategoriesAction } from "@/features/catalog/categories/actions";
import { listBrandsAction } from "@/features/catalog/brands/actions";
import { listUnitsAction } from "@/features/catalog/units/actions";
import { createCatalogItemAction, updateCatalogItemAction } from "../actions";
import { CATALOG_ITEM_TYPES, ITEM_TYPE_LABELS } from "../constants";
import { Package, FileText, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ActionResponse } from "@/types/relationships";
import type { UploadedFile } from "@/types/upload";

const STEPS = [
  { title: "Basic Info", description: "Name, SKU and organization" },
  { title: "Details", description: "Description, image and variants" },
];

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
    isService: boolean;
    trackStock: boolean;
    imageUrl: string | null;
    isActive: boolean;
    variants?: Array<{
      id: string;
      name: string;
      sku: string | null;
      barcode: string | null;
      imageUrl: string | null;
      sortOrder: number;
    }>;
  };
  categories?: Array<{ id: string; name: string }>;
  brands?: Array<{ id: string; name: string }>;
  units?: Array<{ id: string; name: string; abbreviation: string }>;
  commerceCatalogTypes?: string[];
  onSuccess?: () => void;
}

export function CatalogForm({
  mode, businessId, initialData, categories: _categories, brands: _brands, units: _units, commerceCatalogTypes, onSuccess,
}: CatalogFormProps) {
  const [step, setStep] = useState(0);
  const [itemType, setItemType] = useState(initialData?.itemType ?? "PRODUCT");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [variants, setVariants] = useState<Array<{ name: string; sku: string; barcode: string }>>(
    initialData?.variants?.map((v) => ({
      name: v.name,
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
    })) ?? [],
  );

  const [categories, setCategories] = useState(_categories ?? []);
  const [brands, setBrands] = useState(_brands ?? []);
  const [units, setUnits] = useState(_units ?? []);
  const [inlineDialog, setInlineDialog] = useState<"category" | "brand" | "unit" | null>(null);

  const formActionRef = useMemo(
    () => (mode === "create"
      ? createCatalogItemAction.bind(null, businessId)
      : updateCatalogItemAction.bind(null, initialData?.id ?? "")),
    [mode, businessId, initialData?.id],
  );
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(formActionRef, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [allowSubmit, setAllowSubmit] = useState(false);

  function handleFinalSubmit() {
    setAllowSubmit(true);
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  function handleFormSubmit(e: React.FormEvent) {
    if (step < STEPS.length - 1 || !allowSubmit) {
      e.preventDefault();
    }
  }

  const succeeded = state?.success === true;
  useEffect(() => {
    if (succeeded) {
      const timer = setTimeout(() => onSuccess?.(), 1000);
      return () => clearTimeout(timer);
    }
  }, [succeeded, onSuccess]);

  const availableTypes = commerceCatalogTypes
    ? CATALOG_ITEM_TYPES.filter((t) => commerceCatalogTypes.includes(t.toLowerCase()))
    : CATALOG_ITEM_TYPES;

  const showVariants = !commerceCatalogTypes || commerceCatalogTypes.includes("product");

  function addVariant() {
    setVariants((prev) => [...prev, { name: "", sku: "", barcode: "" }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: string, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  async function refreshCategories() {
    const data = await listCategoriesAction(businessId);
    setCategories((data as unknown as Array<{ id: string; name: string }>) ?? []);
  }
  async function refreshBrands() {
    const data = await listBrandsAction(businessId);
    setBrands((data as unknown as Array<{ id: string; name: string }>) ?? []);
  }
  async function refreshUnits() {
    const data = await listUnitsAction(businessId);
    setUnits((data as unknown as Array<{ id: string; name: string; abbreviation: string }>) ?? []);
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form
          ref={formRef}
          action={formAction}
          className="space-y-6"
          onSubmit={handleFormSubmit}
          noValidate
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        >
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="imageUrl" value={imageUrl} />
          {variants.map((v, i) => (
            <div key={i}>
              <input type="hidden" name={`variants.${i}.name`} value={v.name} />
              <input type="hidden" name={`variants.${i}.sku`} value={v.sku} />
              <input type="hidden" name={`variants.${i}.barcode`} value={v.barcode} />
            </div>
          ))}
          <input type="hidden" name="isActive" value="true" />

          {/* Step 0: Basic Info */}
          <div className={step !== 0 ? "hidden" : ""}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Basic Info</h3>
                  <p className="text-sm text-gray-500">Name, SKU and organization</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name" name="name" defaultValue={initialData?.name}
                    placeholder="e.g. Organic Wheat Flour" required
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {!commerceCatalogTypes && (
                  <div className="space-y-2">
                    <Label htmlFor="itemType">
                      Item Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="itemType" name="itemType"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      required
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>{ITEM_TYPE_LABELS[type] ?? type}</option>
                      ))}
                    </select>
                  </div>
                )}
                {commerceCatalogTypes && (
                  <input type="hidden" name="itemType" value={itemType} />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku" name="sku" defaultValue={initialData?.sku ?? ""}
                      placeholder="e.g. WF-001"
                      className="h-11 w-full rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode" name="barcode" defaultValue={initialData?.barcode ?? ""}
                      placeholder="e.g. 123456789012"
                      className="h-11 w-full rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <div className="flex gap-2">
                      <select
                        id="categoryId" name="categoryId"
                        defaultValue={initialData?.categoryId ?? ""}
                        className="flex h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">No category</option>
                        {(categories ?? []).map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" onClick={() => setInlineDialog("category")} title="Add new category">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandId">Brand</Label>
                    <div className="flex gap-2">
                      <select
                        id="brandId" name="brandId"
                        defaultValue={initialData?.brandId ?? ""}
                        className="flex h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">No brand</option>
                        {(brands ?? []).map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" onClick={() => setInlineDialog("brand")} title="Add new brand">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unit</Label>
                    <div className="flex gap-2">
                      <select
                        id="unitId" name="unitId"
                        defaultValue={initialData?.unitId ?? ""}
                        className="flex h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">No unit</option>
                        {(units ?? []).map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" onClick={() => setInlineDialog("unit")} title="Add new unit">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="trackStock" defaultChecked={initialData?.trackStock ?? true} className="h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm font-medium text-gray-700">Track Stock</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Details */}
          <div className={step !== 1 ? "hidden" : ""}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Details</h3>
                  <p className="text-sm text-gray-500">Description, image and variants</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description" name="description"
                  defaultValue={initialData?.description ?? ""}
                  placeholder="Optional description" rows={3}
                  className="rounded-xl border-gray-200 h-24"
                />
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <ImageUploader
                  onUpload={(files: UploadedFile[]) => {
                    if (files[0]) setImageUrl(files[0].url);
                  }}
                  maxFiles={1}
                  existingImages={imageUrl ? [{ id: "existing", url: imageUrl, fileId: "existing", name: "current-image", size: 0, mimeType: "image/*", createdAt: "" }] : []}
                />
                {imageUrl && <p className="text-xs text-green-600">Image uploaded</p>}
              </div>

              {showVariants && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Variants</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addVariant} className="h-8 rounded-lg text-xs">
                      + Add Variant
                    </Button>
                  </div>
                  {variants.length === 0 && (
                    <p className="text-sm text-gray-400">No variants. Click &quot;Add Variant&quot; to create variants.</p>
                  )}
                  {variants.map((v, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Variant {i + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(i)} className="h-7 text-xs text-red-500 hover:text-red-700">
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Variant name" value={v.name}
                          onChange={(e) => updateVariant(i, "name", e.target.value)}
                          className="h-9 rounded-lg border-gray-200 text-sm"
                        />
                        <Input
                          placeholder="SKU" value={v.sku}
                          onChange={(e) => updateVariant(i, "sku", e.target.value)}
                          className="h-9 rounded-lg border-gray-200 text-sm"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-1">
                        <Input
                          placeholder="Barcode" value={v.barcode}
                          onChange={(e) => updateVariant(i, "barcode", e.target.value)}
                          className="h-9 rounded-lg border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {succeeded && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">
              Catalog item {mode === "create" ? "created" : "updated"} successfully!
            </div>
          )}

          {state?.errors && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {Object.values(state.errors).flat().join(", ")}
            </div>
          )}

          {state?.success === false && !state.errors && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {state.message}
            </div>
          )}

          <Dialog open={inlineDialog === "category"} onOpenChange={(open) => { if (!open) setInlineDialog(null); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
                <DialogDescription className="sr-only">Create a new category</DialogDescription>
              </DialogHeader>
              <CategoryForm mode="create" businessId={businessId} onSuccess={() => { setInlineDialog(null); refreshCategories(); }} />
            </DialogContent>
          </Dialog>
          <Dialog open={inlineDialog === "brand"} onOpenChange={(open) => { if (!open) setInlineDialog(null); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Brand</DialogTitle>
                <DialogDescription className="sr-only">Create a new brand</DialogDescription>
              </DialogHeader>
              <BrandForm mode="create" businessId={businessId} onSuccess={() => { setInlineDialog(null); refreshBrands(); }} />
            </DialogContent>
          </Dialog>
          <Dialog open={inlineDialog === "unit"} onOpenChange={(open) => { if (!open) setInlineDialog(null); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Unit</DialogTitle>
                <DialogDescription className="sr-only">Create a new unit</DialogDescription>
              </DialogHeader>
              <UnitForm mode="create" businessId={businessId} onSuccess={() => { setInlineDialog(null); refreshUnits(); }} />
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="h-11 rounded-xl border-gray-200 px-6">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinalSubmit} disabled={pending} className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700">
                {pending ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
