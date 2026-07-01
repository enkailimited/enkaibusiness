"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createExpenseAction } from "../actions";
import { ChevronLeft, ChevronRight, Receipt, FileText } from "lucide-react";
import type { ExpenseCategory } from "@/features/expense-categories/types";

interface ExpenseFormProps {
  businessId: string;
  categories: ExpenseCategory[];
}

const STEPS = [
  { title: "Basic Info", description: "Expense type and amount" },
  { title: "Details", description: "Date, description and payee" },
];

export function ExpenseForm({ businessId, categories }: ExpenseFormProps) {
  const [step, setStep] = useState(0);
  const createAction = useMemo(() => createExpenseAction.bind(null, businessId), [businessId]);
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
          <input type="hidden" name="businessId" value={businessId} />

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Basic Info</h3>
                  <p className="text-sm text-muted-foreground">Expense type and amount</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-sm font-medium">
                    Expense Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select a type</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {state?.errors?.categoryId && (
                    <p className="text-sm text-red-500">{state.errors.categoryId[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 50000"
                    className="h-11 rounded-xl border-border bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {state?.errors?.amount && (
                    <p className="text-sm text-red-500">{state.errors.amount[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Details</h3>
                  <p className="text-sm text-muted-foreground">Date, description and payee</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseDate" className="text-sm font-medium">
                    Date <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="expenseDate"
                    name="expenseDate"
                    type="date"
                    className="h-11 rounded-xl border-border bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Additional info about this expense"
                    className="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidTo" className="text-sm font-medium">
                    Paid To <span className="text-muted-foreground/70">(Optional)</span>
                  </Label>
                  <Input
                    id="paidTo"
                    name="paidTo"
                    placeholder="Vendor or recipient name"
                    className="h-11 rounded-xl border-border bg-background transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
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
                {pending ? "Saving..." : "Save Expense"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
