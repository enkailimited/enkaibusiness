"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createUnitAction, updateUnitAction } from "../actions";
import { UNIT_TYPES, UNIT_TYPE_LABELS } from "../constants";
import { Ruler, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ActionResponse } from "@/types/relationships";

const STEPS = [
  { title: "Taarifa za Msingi", description: "Jina na kifupisho" },
  { title: "Mipangilio", description: "Aina na msingi" },
];

interface UnitFormProps {
  mode: "create" | "edit";
  businessId: string;
  initialData?: {
    id: string;
    name: string;
    abbreviation: string;
    type: string;
    isBase: boolean;
  };
}

export function UnitForm({ mode, businessId, initialData }: UnitFormProps) {
  const [step, setStep] = useState(0);
  const action = mode === "create"
    ? createUnitAction.bind(null, businessId)
    : updateUnitAction.bind(null, initialData?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

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
                  <Ruler className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taarifa za Msingi</h3>
                  <p className="text-sm text-gray-500">Jina na kifupisho</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Jina la Kipimo <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" defaultValue={initialData?.name} placeholder="k.m. Kilogram" required className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abbreviation" className="text-sm font-medium">
                    Kifupisho <span className="text-red-500">*</span>
                  </Label>
                  <Input id="abbreviation" name="abbreviation" defaultValue={initialData?.abbreviation} placeholder="k.m. kg" required className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Settings2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mipangilio</h3>
                  <p className="text-sm text-gray-500">Aina na msingi</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Aina ya Kipimo <span className="text-red-500">*</span>
                  </Label>
                  <select id="type" name="type" defaultValue={initialData?.type ?? "count"} required className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    {UNIT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {UNIT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="isBase" defaultChecked={initialData?.isBase ?? false} className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm font-medium text-gray-700">Kipimo cha Msingi</span>
                </label>
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
