"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createStoreAction } from "../actions";
import { Store, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { title: "Taarifa za Msingi", description: "Jina na msimbo" },
  { title: "Maelezo", description: "Maelezo ya duka" },
];

interface StoreFormProps {
  branchId: string;
}

export function StoreForm({ branchId }: StoreFormProps) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(createStoreAction.bind(null, branchId), null);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6">
          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Store className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taarifa za Msingi</h3>
                  <p className="text-sm text-gray-500">Jina na msimbo</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Jina la Duka <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" required className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Msimbo <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input id="code" name="code" className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
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
                  <p className="text-sm text-gray-500">Maelezo ya duka</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Maelezo <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input id="description" name="description" className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
          </div>

          {state?.message && (
            <div className={`rounded-xl p-4 text-sm ${state.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              <p className="font-medium">{state.message}</p>
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
