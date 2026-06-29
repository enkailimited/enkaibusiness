"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo, useEffect, useRef } from "react";
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
  { title: "Basic Info", description: "Name and abbreviation" },
  { title: "Settings", description: "Type and base unit" },
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
  onSuccess?: () => void;
}

export function UnitForm({ mode, businessId, initialData, onSuccess }: UnitFormProps) {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState(initialData?.type ?? "count");
  const formActionRef = useMemo(
    () => (mode === "create"
      ? createUnitAction.bind(null, businessId)
      : updateUnitAction.bind(null, initialData?.id ?? "")),
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
                  <Ruler className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Basic Info</h3>
                  <p className="text-sm text-gray-500">Name and abbreviation</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Unit Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" defaultValue={initialData?.name}                     placeholder="e.g. Kilogram" required className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abbreviation" className="text-sm font-medium">
                    Abbreviation <span className="text-red-500">*</span>
                  </Label>
                  <Input id="abbreviation" name="abbreviation" defaultValue={initialData?.abbreviation}                     placeholder="e.g. kg" required className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
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
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-500">Type and base unit</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Unit Type <span className="text-red-500">*</span>
                  </Label>
                  <select id="type" name="type" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} required className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    {UNIT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {UNIT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="isBase" defaultChecked={initialData?.isBase ?? false} className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm font-medium text-gray-700">Base Unit</span>
                </label>
              </div>
            </div>
          </div>

          {succeeded && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">
              Unit {mode === "create" ? "created" : "updated"} successfully!
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

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="h-11 rounded-xl border-gray-200 px-6">
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
