"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createCategoryAction, updateCategoryAction } from "../actions";
import { FolderTree, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { ActionResponse } from "@/types/relationships";

const STEPS = [
  { title: "Taarifa za Msingi", description: "Jina na kategoria mzazi" },
  { title: "Maelezo", description: "Mpangilio, maelezo na picha" },
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
}

export function CategoryForm({ mode, businessId, categories, initialData }: CategoryFormProps) {
  const [step, setStep] = useState(0);
  const action = mode === "create"
    ? createCategoryAction.bind(null, businessId)
    : updateCategoryAction.bind(null, initialData?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

  const availableParents = (categories ?? []).filter(
    (c) => c.id !== initialData?.id,
  );

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="businessId" value={businessId} />

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <FolderTree className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taarifa za Msingi</h3>
                  <p className="text-sm text-gray-500">Jina na kategoria mzazi</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Jina la Kategoria <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" defaultValue={initialData?.name} placeholder="k.m. Nafaka" required className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentId" className="text-sm font-medium">
                    Kategoria Mzazi <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <select id="parentId" name="parentId" defaultValue={initialData?.parentId ?? ""} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Hakuna (ngazi ya juu)</option>
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
                  <h3 className="font-semibold text-gray-900">Maelezo</h3>
                  <p className="text-sm text-gray-500">Mpangilio, maelezo na picha</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-sm font-medium">
                    Mpangilio <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={initialData?.sortOrder ?? 0} className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Maelezo <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Textarea id="description" name="description" defaultValue={initialData?.description ?? ""} placeholder="Maelezo ya hiari" rows={3} className="rounded-xl border-gray-200 h-24" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-sm font-medium">
                    URL ya Picha <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={initialData?.imageUrl ?? ""} placeholder="https://example.com/category-image.jpg" className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
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
              <ChevronLeft className="mr-2 h-4 w-4" /> Nyuma
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
                Endelea <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={pending} className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700">
                {pending ? "Inahifadhi..." : "Hifadhi"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
