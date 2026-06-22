"use client";

import { cn } from "@/lib/utils";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createInvoiceAction } from "../actions";
import type { Customer } from "@/features/customers/types";
import { ChevronLeft, ChevronRight, FileText, Package, CreditCard } from "lucide-react";

interface InvoiceFormProps {
  businessId: string;
  customers: Customer[];
}

const STEPS = [
  { title: "Taarifa za Msingi", description: "Mteja na tarehe ya ankara" },
  { title: "Bidhaa", description: "Bidhaa kwenye ankara" },
  { title: "Malipo", description: "Maelezo na jumla" },
];

export function InvoiceForm({ businessId, customers }: InvoiceFormProps) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(createInvoiceAction.bind(null, businessId), null);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6">
          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taarifa za Msingi</h3>
                  <p className="text-sm text-gray-500">Mteja na tarehe ya ankara</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId" className="text-sm font-medium">
                    Mteja <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="customerId"
                    name="customerId"
                    required
                    className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Chagua mteja</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName}{c.lastName ? ` ${c.lastName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleId" className="text-sm font-medium">
                    Unganisha na Mauzo <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="saleId"
                    name="saleId"
                    placeholder="Mf. SALE-001"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    Tarehe ya Kukamilisha <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bidhaa</h3>
                  <p className="text-sm text-gray-500">Bidhaa kwenye ankara</p>
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-sm font-medium text-gray-900">Bidhaa</span>
                <div id="items-container" className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-gray-500">Kitambulisho cha Bidhaa</Label>
                      <Input
                        name="items[0][catalogItemId]"
                        placeholder="Catalog item ID"
                        className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="w-20 space-y-2">
                      <Label className="text-xs text-gray-500">Idadi</Label>
                      <Input
                        name="items[0][quantity]"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Qty"
                        className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label className="text-xs text-gray-500">Bei</Label>
                      <Input
                        name="items[0][unitPrice]"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 2 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Malipo</h3>
                  <p className="text-sm text-gray-500">Maelezo ya ankara</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Maelezo <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Maelezo ya ziada..."
                  />
                </div>
              </div>
            </div>
          </div>

          {state?.errors && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              <p className="font-medium">Kuna hitilafu</p>
              <ul className="mt-2 list-inside list-disc text-xs">
                {Object.entries(state.errors).map(([field, msgs]) => (
                  Array.isArray(msgs) ? msgs.map((msg, i) => <li key={`${field}-${i}`}>{field}: {msg}</li>) : null
                ))}
              </ul>
            </div>
          )}

          {state?.message && !state.errors && (
            <div className={`rounded-xl p-4 text-sm ${
              state.success
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <p className="font-medium">{state.message}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="h-11 rounded-xl border-gray-200 px-6"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Nyuma
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
              >
                Endelea
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {pending ? "Inahifadhi..." : "Hifadhi Ankara"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
