"use client";

import { useState, useActionState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { cn } from "@/lib/utils";
import { createBranchAction } from "../actions";
import { ChevronLeft, ChevronRight, Building2, Mail, MapPin, Settings2 } from "lucide-react";

interface BranchFormProps {
  businessId: string;
}

const STEPS = [
  { title: "Basic Info", description: "Branch name and code" },
  { title: "Contact", description: "Address, phone and email" },
  { title: "Location", description: "City, region and country" },
  { title: "Settings", description: "Working hours and headquarters" },
];

export function BranchForm({ businessId }: BranchFormProps) {
  const [step, setStep] = useState(0);
  const createAction = useMemo(() => createBranchAction.bind(null, businessId), [businessId]);
  const [state, formAction, pending] = useActionState(createAction, null);
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

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form ref={formRef} action={formAction} onSubmit={handleFormSubmit} noValidate className="space-y-6" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Basic Info</h3>
                  <p className="text-sm text-muted-foreground">Branch name and code</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Branch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Dar es Salaam Branch"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {state?.errors?.name && (
                    <p className="text-sm text-red-500">{state.errors.name[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Branch Code <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g. DSM-001"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Contact</h3>
                  <p className="text-sm text-muted-foreground">Branch contact information</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="branch@business.co.tz"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+255 712 345 678"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Samora Avenue, ABC Building"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 2 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Location</h3>
                  <p className="text-sm text-muted-foreground">Where your branch is located</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Dar es Salaam"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    Region <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="Dar es Salaam"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue="Tanzania"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    Postal Code <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="e.g. 14111"
                    className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 3 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <Settings2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Settings</h3>
                  <p className="text-sm text-muted-foreground">Working hours and headquarters</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingTime" className="text-sm font-medium">
                      Opening Time <span className="text-muted-foreground/70">(Optional)</span>
                    </Label>
                    <Input
                      id="openingTime"
                      name="openingTime"
                      type="time"
                      defaultValue="08:00"
                      className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closingTime" className="text-sm font-medium">
                      Closing Time <span className="text-muted-foreground/70">(Optional)</span>
                    </Label>
                    <Input
                      id="closingTime"
                      name="closingTime"
                      type="time"
                      defaultValue="17:00"
                      className="h-11 rounded-xl border-input bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-input bg-background p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50">
                  <input
                    type="checkbox"
                    id="isHeadOffice"
                    name="isHeadOffice"
                    value="true"
                    className="h-5 w-5 rounded-lg border-input text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Head Office</span>
                    <p className="text-xs text-muted-foreground">This branch is the head office of your business</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {state?.message && (
            <div
              className={`rounded-xl p-4 text-sm ${
                state.success
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
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

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="h-11 rounded-xl border-border px-6"
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
                type="button"
                onClick={handleFinalSubmit}
                disabled={pending}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {pending ? "Saving..." : "Save Branch"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
