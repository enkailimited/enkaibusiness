"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBusinessAction, listActivePlansAction } from "../actions";
import { BUSINESS_SIZE_LABELS } from "@/features/subscriptions/constants/pricing";
import { INDUSTRIES, INDUSTRY_LABELS, BUSINESS_MODES } from "../constants";
import { Check, ChevronLeft, ChevronRight, Building2, Settings, CreditCard, Loader2, UserPlus } from "lucide-react";

type Plan = { id: string; name: string; amount: number; currency: string; interval: string };

interface BusinessFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, label: "Business", icon: Building2 },
  { id: 2, label: "Industry & Plan", icon: Settings },
  { id: 3, label: "Review", icon: CreditCard },
];

const initialFormData = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  industry: "COMMERCE" as string,
  modes: [] as string[],
  businessSize: "small" as string,
  planId: "" as string,
};

export function BusinessForm({ workspaceId, onSuccess }: BusinessFormProps) {
  const [state, formAction, pending] = useActionState(createBusinessAction.bind(null, workspaceId), null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    listActivePlansAction().then((data) => setPlans(data as unknown as Plan[]));
  }, []);

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const availableModes = BUSINESS_MODES[formData.industry] ?? [];

  const toggleMode = (mode: string) => {
    setFormData((prev) => ({
      ...prev,
      modes: prev.modes.includes(mode)
        ? prev.modes.filter((m) => m !== mode)
        : [...prev.modes, mode],
    }));
  };

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const canNext = () => {
    if (step === 1) return formData.name.trim() && formData.slug.trim();
    if (step === 2) return formData.modes.length > 0 && !!formData.planId;
    return true;
  };

  const handleNext = () => {
    if (canNext()) setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const selectedPlan = plans.find((p) => p.id === formData.planId);

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="mb-4 flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  step > s.id
                    ? "bg-primary text-primary-foreground"
                    : step === s.id
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-10 transition-colors ${
                    step > s.id ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <CardTitle className="text-lg text-center">
          {step === 1 && "Business Details"}
          {step === 2 && "Industry & Subscription"}
          {step === 3 && "Review & Confirm"}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 1 && "Tell us about your business"}
          {step === 2 && "Set up industry and subscription"}
          {step === 3 && "Verify everything looks correct"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form action={formAction}>
          <input type="hidden" name="modes" value={JSON.stringify(formData.modes)} />

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={(e) => updateField("taxId", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={(e) => {
                    updateField("industry", e.target.value);
                    setFormData((prev) => ({ ...prev, modes: [] }));
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{INDUSTRY_LABELS[ind]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Modes</Label>
                <div className="flex flex-wrap gap-2">
                  {availableModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => toggleMode(mode)}
                      className={`rounded-md px-3 py-1.5 text-sm border transition-colors ${
                        formData.modes.includes(mode)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-accent"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessSize">Business Size</Label>
                <select
                  id="businessSize"
                  name="businessSize"
                  value={formData.businessSize}
                  onChange={(e) => updateField("businessSize", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {Object.entries(BUSINESS_SIZE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planId">Subscription Plan</Label>
                <select
                  id="planId"
                  name="planId"
                  required
                  value={formData.planId}
                  onChange={(e) => updateField("planId", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select a plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {plan.interval} ({new Intl.NumberFormat().format(plan.amount)} {plan.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                <h4 className="font-semibold text-base">Business Info</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Slug</span>
                    <p className="font-medium">{formData.slug}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Industry</span>
                    <p className="font-medium">{INDUSTRY_LABELS[formData.industry]}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Modes</span>
                    <p className="font-medium">{formData.modes.join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Size</span>
                    <p className="font-medium">{BUSINESS_SIZE_LABELS[formData.businessSize]}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Plan</span>
                    <p className="font-medium">{selectedPlan?.name ?? "—"}</p>
                  </div>
                </div>
                {(formData.email || formData.phone) && (
                  <>
                    <hr />
                    <div className="grid grid-cols-2 gap-2">
                      {formData.email && (
                        <div>
                          <span className="text-xs text-muted-foreground">Email</span>
                          <p className="font-medium">{formData.email}</p>
                        </div>
                      )}
                      {formData.phone && (
                        <div>
                          <span className="text-xs text-muted-foreground">Phone</span>
                          <p className="font-medium">{formData.phone}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Business
                  </>
                )}
              </Button>
            </div>
          )}

          {state?.errors && (
            <div className="text-sm text-destructive space-y-1 mt-4">
              {Object.entries(state.errors).map(([field, msgs]) => (
                <p key={field}>{field}: {msgs.join(", ")}</p>
              ))}
            </div>
          )}

          {state?.message && !state.errors && (
            <p className={state.success ? "text-sm text-green-600 mt-4" : "text-sm text-destructive mt-4"}>
              {state.message}
            </p>
          )}
        </form>

        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <Button type="button" variant="outline" size="sm" onClick={handleBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : <div />}
          {step < 3 && (
            <Button type="button" size="sm" onClick={handleNext} disabled={!canNext()} className="gap-1">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}