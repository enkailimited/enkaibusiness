"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createBrandAction, updateBrandAction } from "../actions";
import { Tag, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { ActionResponse } from "@/types/relationships";

const STEPS = [
  { title: "Basic Info", description: "Brand name" },
  { title: "Details", description: "Description and image" },
];

interface BrandFormProps {
  mode: "create" | "edit";
  businessId: string;
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
  };
}

export function BrandForm({ mode, businessId, initialData }: BrandFormProps) {
  const [step, setStep] = useState(0);
  const formActionRef = useMemo(
    () => (mode === "create"
      ? createBrandAction.bind(null, businessId)
      : updateBrandAction.bind(null, initialData?.id ?? "")),
    [mode, businessId, initialData?.id],
  );
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(formActionRef, null);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <input type="hidden" name="businessId" value={businessId} />

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Tag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Basic Info</h3>
                  <p className="text-sm text-gray-500">Brand name</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Brand Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" defaultValue={initialData?.name}                     placeholder="e.g. Nestlé" required className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
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
                  <h3 className="font-semibold text-gray-900">Details</h3>
                  <p className="text-sm text-gray-500">Description and image</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Textarea id="description" name="description" defaultValue={initialData?.description ?? ""}                     placeholder="Optional description" rows={3} className="rounded-xl border-gray-200 h-24" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl" className="text-sm font-medium">
                    Image URL <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input id="logoUrl" name="logoUrl" defaultValue={initialData?.logoUrl ?? ""} placeholder="https://example.com/logo.png" className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
          </div>

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

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="h-11 rounded-xl border-gray-200 px-6">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={pending} className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700">
                {pending ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
