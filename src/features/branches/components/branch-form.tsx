"use client";

import { useState, useActionState } from "react";
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
  { title: "Taarifa za Msingi", description: "Jina na msimbo wa tawi" },
  { title: "Mawasiliano", description: "Anwani, simu na barua pepe" },
  { title: "Eneo", description: "Mji, mkoa na nchi" },
  { title: "Mipangilio", description: "Muda na makao makuu" },
];

export function BranchForm({ businessId }: BranchFormProps) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(createBranchAction.bind(null, businessId), null);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6">
          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taarifa za Msingi</h3>
                  <p className="text-sm text-gray-500">Jina na msimbo wa tawi lako</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Jina la Tawi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Mf. Tawi la Dar es Salaam"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {state?.errors?.name && (
                    <p className="text-sm text-red-500">{state.errors.name[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Msimbo wa Tawi <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="Mf. DSM-001"
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
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mawasiliano</h3>
                  <p className="text-sm text-gray-500">Taarifa za mawasiliano ya tawi</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Barua Pepe <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tawi@biashara.co.tz"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Nambari ya Simu <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+255 712 345 678"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Anwani <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Mtaa wa Samora, Jengo la ABC"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  <h3 className="font-semibold text-gray-900">Eneo</h3>
                  <p className="text-sm text-gray-500">Mahali ulipo tawi lako</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Jiji / Mji <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Dar es Salaam"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    Mkoa <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="Dar es Salaam"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Nchi <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue="Tanzania"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    Msimbo wa Posta <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="Mf. 14111"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  <h3 className="font-semibold text-gray-900">Mipangilio</h3>
                  <p className="text-sm text-gray-500">Muda wa kazi na makao makuu</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingTime" className="text-sm font-medium">
                      Saa ya Kufungua <span className="text-gray-400">(Hiari)</span>
                    </Label>
                    <Input
                      id="openingTime"
                      name="openingTime"
                      type="time"
                      defaultValue="08:00"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closingTime" className="text-sm font-medium">
                      Saa ya Kufunga <span className="text-gray-400">(Hiari)</span>
                    </Label>
                    <Input
                      id="closingTime"
                      name="closingTime"
                      type="time"
                      defaultValue="17:00"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50">
                  <input
                    type="checkbox"
                    id="isHeadOffice"
                    name="isHeadOffice"
                    value="true"
                    className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Makao Makuu</span>
                    <p className="text-xs text-gray-500">Tawi hili ndio makao makuu ya biashara yako</p>
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
                {pending ? "Inahifadhi..." : "Hifadhi Tawi"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
