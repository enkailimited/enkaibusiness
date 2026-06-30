"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormStepper } from "@/components/ui/form-stepper";
import { listPlansForRegistrationAction, getReadyToRegisterLeadsAction } from "./actions";
import { registerBusinessAction } from "@/features/businesses/actions";
import type { RegisterBusinessInput } from "@/features/businesses/schemas";
import { BUSINESS_SIZE_LABELS, COMMERCE_BASE_PRICE_PER_DAY, QR_CODE_STICKER_COUNT, QR_CODE_STICKER_PRICE, calculateDailyPrice, calculateSetupFee } from "@/features/subscriptions/constants/pricing";
import { BUSINESS_MODES, INDUSTRIES, INDUSTRY_LABELS } from "@/features/businesses/constants";
import {
  UserPlus, Building2, CreditCard, QrCode, ChevronLeft, ChevronRight,
  CheckCircle2, Loader2, Mail, Phone,
} from "lucide-react";

const STEPS = [
  { title: "Customer", description: "Select a converted customer" },
  { title: "Business", description: "Business details" },
  { title: "Plan", description: "Choose a pricing plan" },
  { title: "QR & Finish", description: "Setup and payment" },
];

interface LeadItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  convertedAt: string | null;
  convertedToUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amount: string | number;
  currency: string;
  interval: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const slugManuallyEdited = useRef(false);

  const [form, setForm] = useState<{
    businessName: string;
    businessSlug: string;
    businessIndustry: string;
    businessModes: string[];
    businessAddress: string;
    planId: string;
    businessSize: string;
    qrOrderingEnabled: boolean;
  }>({
    businessName: "",
    businessSlug: "",
    businessIndustry: "COMMERCE",
    businessModes: BUSINESS_MODES["COMMERCE"]?.length ? [BUSINESS_MODES["COMMERCE"][0]!] : [],
    businessAddress: "",
    planId: "",
    businessSize: "small",
    qrOrderingEnabled: false,
  });

  useEffect(() => {
    Promise.all([
      getReadyToRegisterLeadsAction(),
      listPlansForRegistrationAction(),
    ]).then(([leadsResult, plansResult]) => {
      setLeads(leadsResult as unknown as LeadItem[]);
      setPlans(plansResult as unknown as Plan[]);
      setLoading(false);
    });
  }, []);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const toSlug = (value: string) => value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const update = (field: string, value: unknown) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "businessName" && typeof value === "string" && !slugManuallyEdited.current) {
        next.businessSlug = toSlug(value);
      }
      if (field === "businessSlug" && typeof value === "string") {
        slugManuallyEdited.current = value !== toSlug(prev.businessName);
      }
      return next;
    });
  };

  const selectedPlan = plans.find((p) => p.id === form.planId);
  const planDailyRate = selectedPlan
    ? Number(selectedPlan.amount) / (selectedPlan.interval === "WEEKLY" ? 7 : selectedPlan.interval === "MONTHLY" ? 30 : 1)
    : COMMERCE_BASE_PRICE_PER_DAY;
  const dailyPrice = calculateDailyPrice(
    planDailyRate,
    form.businessSize,
    form.qrOrderingEnabled,
  );
  const { setupFee, qrPrintingFee, total: totalSetupFee } = calculateSetupFee(form.qrOrderingEnabled, form.businessModes);
  const weeklyEstimate = dailyPrice * 7;
  const monthlyEstimate = dailyPrice * 30;

  const canProceed = () => {
    if (step === 0) return !!selectedLeadId;
    if (step === 1) return form.businessName && form.businessSlug && form.businessModes.length > 0;
    if (step === 2) return !!form.planId;
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedLeadId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await registerBusinessAction({
        name: form.businessName,
        slug: form.businessSlug,
        industry: form.businessIndustry as RegisterBusinessInput["industry"],
        modes: form.businessModes,
        address: form.businessAddress || undefined,
        planId: form.planId,
        businessSize: form.businessSize,
        qrOrderingEnabled: form.qrOrderingEnabled,
        leadId: selectedLeadId,
        currency: "TZS",
        timezone: "Africa/Dar_es_Salaam",
      });
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || "Failed to register");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader title="Register Customer" description="Register a business for a customer" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (success && selectedLead) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader title="Register Customer" description="Register a business for a customer" />
        <Card className="border-0 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Registration Complete!</h2>
            <p className="mb-2 text-gray-500">
              Business <strong>{form.businessName}</strong> has been registered successfully.
            </p>
            <p className="mb-8 text-sm text-gray-400">
              Customer {selectedLead.firstName} {selectedLead.lastName} can now start using the system.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/platform/sales-team/clients")}
                className="rounded-xl"
              >
                View Clients
              </Button>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setStep(0);
                  setSelectedLeadId(null);
                  setForm({
                    businessName: "", businessSlug: "", businessIndustry: "COMMERCE",
                    businessModes: ["retail"], businessAddress: "",
                    planId: "", businessSize: "small", qrOrderingEnabled: false,
                  });
                }}
                className="rounded-xl bg-blue-600"
              >
                Register Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inputClass = "h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const selectClass = "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Register Customer" description="Register a new business for a converted customer" />

      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <FormStepper steps={STEPS} currentStep={step} />

          {/* Step 0: Select Lead */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Select Customer</h3>
                  <p className="text-sm text-gray-500">Converted customers not yet registered</p>
                </div>
              </div>

              {leads.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                  <p className="text-gray-500">No converted customers ready to register.</p>
                  <p className="mt-1 text-sm text-gray-400">Change a lead to "CONVERTED" on the leads page first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead) => {
                    const isSelected = selectedLeadId === lead.id;
                    const user = lead.convertedToUser;
                    return (
                      <label
                        key={lead.id}
                        className={`relative flex cursor-pointer items-start gap-4 rounded-xl border-2 p-5 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="lead"
                          value={lead.id}
                          checked={isSelected}
                          onChange={() => setSelectedLeadId(lead.id)}
                          className="sr-only"
                        />
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <UserPlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {lead.firstName} {lead.lastName}
                          </p>
                          {user && (
                            <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="h-3.5 w-3.5" />
                                  {user.phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Business Info</h3>
                  <p className="text-sm text-gray-500">Fill in the customer's business details</p>
                </div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">
                  Customer: {selectedLead?.firstName} {selectedLead?.lastName} ({selectedLead?.convertedToUser?.email})
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Business Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="e.g. Juma's Store"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Business Slug <span className="text-red-500">*</span></Label>
                <Input
                  value={form.businessSlug}
                  onChange={(e) => update("businessSlug", e.target.value)}
                  placeholder="duka-la-juma"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400">Unique identifier used in URLs and the system</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Industry <span className="text-red-500">*</span></Label>
                    <select
                    value={form.businessIndustry}
                    onChange={(e) => {
                      update("businessIndustry", e.target.value);
                      const newModes: string[] = BUSINESS_MODES[e.target.value] || [];
                      update("businessModes", newModes.length ? [newModes[0]!] : []);
                    }}
                    className={selectClass}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{INDUSTRY_LABELS[ind]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Business Size <span className="text-red-500">*</span></Label>
                  <select
                    value={form.businessSize}
                    onChange={(e) => update("businessSize", e.target.value)}
                    className={selectClass}
                  >
                    {Object.entries(BUSINESS_SIZE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Business Type <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {(BUSINESS_MODES[form.businessIndustry] || []).map((mode) => (
                    <label
                      key={mode}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                        form.businessModes.includes(mode)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.businessModes.includes(mode)}
                        onChange={() => {
                          const modes = form.businessModes.includes(mode)
                            ? form.businessModes.filter((m) => m !== mode)
                            : [...form.businessModes, mode];
                          update("businessModes", modes);
                        }}
                        className="sr-only"
                      />
                      {mode.charAt(0).toUpperCase() + mode.slice(1).replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Address <span className="text-gray-400">(Optional)</span></Label>
                <Input
                  value={form.businessAddress}
                  onChange={(e) => update("businessAddress", e.target.value)}
                  placeholder="e.g. Samora Avenue, Dar es Salaam"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Choose Pricing Plan</h3>
                  <p className="text-sm text-gray-500">Select a plan that fits the customer's business</p>
                </div>
              </div>
              <div className="grid gap-4">
                  {plans.map((plan) => {
                  const isSelected = form.planId === plan.id;
                  const planDailyRate = Number(plan.amount) / (plan.interval === "WEEKLY" ? 7 : plan.interval === "MONTHLY" ? 30 : 1);
                  const planDailyPrice = calculateDailyPrice(planDailyRate, form.businessSize, form.qrOrderingEnabled);
                  return (
                    <label
                      key={plan.id}
                      className={`relative block cursor-pointer rounded-xl border-2 p-5 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={isSelected}
                        onChange={() => update("planId", plan.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(planDailyPrice)}
                          </p>
                          <p className="text-xs text-gray-400">per day</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                        <span>Base price: {formatCurrency(planDailyRate)}/day</span>
                        <span>Period: {plan.interval.toLowerCase()}</span>
                        <span>Total: {formatCurrency(Number(plan.amount))}/{plan.interval.toLowerCase()}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: QR Ordering & Summary */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <QrCode className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">QR Ordering & Payment</h3>
                  <p className="text-sm text-gray-500">Setup and complete registration</p>
                </div>
              </div>

              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-5 transition-all ${
                  form.qrOrderingEnabled
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.qrOrderingEnabled}
                  onChange={(e) => update("qrOrderingEnabled", e.target.checked)}
                  className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">QR Ordering</span>
                    {!form.qrOrderingEnabled && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        Off
                      </span>
                    )}
                    {form.qrOrderingEnabled && (
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Enable so customers can order products by scanning QR codes on tables or in-store.
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">QR printing:</span> {formatCurrency(QR_CODE_STICKER_PRICE)} per sticker × {QR_CODE_STICKER_COUNT} = {formatCurrency(QR_CODE_STICKER_PRICE * QR_CODE_STICKER_COUNT)}
                    </p>
                    {form.qrOrderingEnabled && (
                      <p className="text-orange-600">
                        Daily price will increase by 20% due to QR ordering
                      </p>
                    )}
                  </div>
                </div>
              </label>

              {/* Summary Card */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h4 className="mb-3 font-semibold text-gray-900">Cost Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan price per day</span>
                    <span className="font-medium text-gray-900">{formatCurrency(dailyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per week (×7)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(weeklyEstimate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per month (×30)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(monthlyEstimate)}</span>
                  </div>
                  {setupFee > 0 && (
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span className="text-gray-600">Setup fee</span>
                      <span className="font-medium text-blue-600">+{formatCurrency(setupFee)}</span>
                    </div>
                  )}
                  {qrPrintingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">QR sticker ({QR_CODE_STICKER_COUNT} × {formatCurrency(QR_CODE_STICKER_PRICE)})</span>
                      <span className="font-medium text-orange-600">+{formatCurrency(qrPrintingFee)}</span>
                    </div>
                  )}
                  {(setupFee > 0 || qrPrintingFee > 0) && (
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
                      <span className="font-semibold text-gray-900">Initial total (one-time payment)</span>
                      <span className="font-bold text-gray-900">{formatCurrency(totalSetupFee)}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
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
                disabled={!canProceed()}
                className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Register Business
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
