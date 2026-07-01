"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { ImageUploader } from "@/components/upload/image-uploader";
import { createCategoryAction, updateCategoryAction } from "../actions";
import { FolderTree, FileText, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { ActionResponse } from "@/types/relationships";
import type { UploadedFile } from "@/types/upload";

const STEPS = [
  { title: "Basic Info", description: "Name and parent category" },
  { title: "Details", description: "Sort order, description and image" },
];

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
  onSuccess?: () => void;
}

export function CategoryForm({ mode, businessId, categories, initialData, onSuccess }: CategoryFormProps) {
  const [step, setStep] = useState(0);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [showSuccess, setShowSuccess] = useState(false);
  const formActionRef = useMemo(
    () => (mode === "create"
      ? createCategoryAction.bind(null, businessId)
      : updateCategoryAction.bind(null, initialData?.id ?? "")),
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
    e.stopPropagation();
  }

  const isSuccess = state?.success === true;
  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        onSuccess?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess]);

  const availableParents = (categories ?? []).filter(
    (c) => c.id !== initialData?.id,
  );

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form ref={formRef} action={formAction} onSubmit={handleFormSubmit} noValidate className="space-y-6" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <input type="hidden" name="businessId" value={businessId} />

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <FolderTree className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Basic Info</h3>
                  <p className="text-sm text-muted-foreground">Name and parent category</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" defaultValue={initialData?.name}                     placeholder="e.g. Grains" required className="h-11 rounded-xl border-border bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentId" className="text-sm font-medium">
                    Parent Category <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <select id="parentId" name="parentId" defaultValue={initialData?.parentId ?? ""} className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option value="">None (top level)</option>
                    {availableParents.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Details</h3>
                  <p className="text-sm text-muted-foreground">Sort order, description and image</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-sm font-medium">
                    Sort Order <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={initialData?.sortOrder ?? 0} className="h-11 rounded-xl border-border bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Textarea id="description" name="description" defaultValue={initialData?.description ?? ""}                     placeholder="Optional description" rows={3} className="rounded-xl border-border h-24" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Category Image <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <input type="hidden" name="imageUrl" value={imageUrl} />
                  <ImageUploader
                    onUpload={(files: UploadedFile[]) => {
                      if (files[0]) setImageUrl(files[0].url);
                    }}
                    maxFiles={1}
                    existingImages={imageUrl ? [{ id: "existing", url: imageUrl, fileId: "existing", name: "current-image", size: 0, mimeType: "image/*", createdAt: "" }] : []}
                  />
                  {imageUrl && (
                    <p className="text-xs text-green-600">Image uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showSuccess && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {state?.message ?? "Saved successfully"}
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

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="h-11 rounded-xl border-border px-6">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" disabled={pending} onClick={handleFinalSubmit} className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700">
                {pending ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
