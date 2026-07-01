"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createLocationAction, updateLocationAction } from "../actions";
import { MapPin, Navigation, ChevronLeft, ChevronRight } from "lucide-react";
import type { LocationWithBalances } from "../types";

interface BranchOption {
  id: string;
  name: string;
  isHeadOffice: boolean;
  stores: Array<{ id: string; name: string }>;
}

const STEPS = [
  { title: "Basic Info", description: "Location name" },
  { title: "Location", description: "Branch and store" },
];

interface LocationFormProps {
  businessId: string;
  branches: BranchOption[];
  location?: LocationWithBalances;
  onSuccess?: () => void;
}

export function LocationForm({ businessId, branches, location, onSuccess }: LocationFormProps) {
  const [step, setStep] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState(location?.branchId ?? "");
  const formActionRef = useMemo(
    () => (location ? updateLocationAction.bind(null, location.id) : createLocationAction),
    [location],
  );
  const [state, formAction, pending] = useActionState(formActionRef, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [allowSubmit, setAllowSubmit] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const storeOptions = selectedBranch?.stores ?? [];

  const branchOptions = branches.map((b) => ({
    value: b.id,
    label: b.isHeadOffice ? `${b.name} (HQ)` : b.name,
  }));

  function handleFinalSubmit() {
    setAllowSubmit(true);
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  function handleFormSubmit(e: React.FormEvent) {
    if (step < STEPS.length - 1 || !allowSubmit) {
      e.preventDefault();
    }
  }

  if (state?.success && onSuccess) {
    onSuccess();
  }

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
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Basic Info</h3>
                  <p className="text-sm text-muted-foreground">Location name</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Location Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" defaultValue={location?.name ?? ""}                     placeholder="Main Warehouse" required className="h-11 rounded-xl border-border bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  {state?.errors?.name && (
                    <p className="text-sm text-destructive">{state.errors.name[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Navigation className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Location</h3>
                  <p className="text-sm text-muted-foreground">Branch and store</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branchId" className="text-sm font-medium">
                    Branch <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Select
                    id="branchId"
                    name="branchId"
                    options={branchOptions}
                    placeholder="Select a branch"
                    defaultValue={location?.branchId ?? ""}
                    onChange={(e) => { setSelectedBranchId(e.target.value); }}
                    className="h-11 rounded-xl border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeId" className="text-sm font-medium">
                    Store <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Select
                    id="storeId"
                    name="storeId"
                    options={storeOptions.map((s) => ({ value: s.id, label: s.name }))}
                    placeholder="Select a store"
                    defaultValue={location?.storeId ?? ""}
                    className="h-11 rounded-xl border-border bg-background"
                  />
                  {!selectedBranch && (
                    <p className="text-xs text-muted-foreground/70">Select a branch first to see available stores</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {state?.message && !state?.success && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              <p className="font-medium">{state.message}</p>
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
