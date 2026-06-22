"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createCustomerAction } from "../actions";
import { ChevronLeft, ChevronRight, UserPlus, MapPin, Settings2 } from "lucide-react";
import { CUSTOMER_TYPES } from "../constants";
import type { CustomerGroup } from "@/features/customer-groups/types";

interface CustomerFormProps {
  businessId: string;
  groups: CustomerGroup[];
}

const STEPS = [
  { title: "Taarifa za Msingi", description: "Jina la kwanza, mwisho na mawasiliano" },
  { title: "Maelezo", description: "Anwani, mji na aina ya mteja" },
  { title: "Mipangilio", description: "Kikundi, kikomo cha mikopo na hali" },
];

export function CustomerForm({ businessId, groups }: CustomerFormProps) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(createCustomerAction.bind(null, businessId), null);

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
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taarifa za Msingi</h3>
                  <p className="text-sm text-gray-500">Jina la kwanza, mwisho na mawasiliano</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      Jina la Kwanza <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      required
                      placeholder="Mf. Juma"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {state?.errors?.firstName && (
                      <p className="text-sm text-red-500">{state.errors.firstName[0]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Jina la Mwisho <span className="text-gray-400">(Hiari)</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Mf. Mohamed"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Barua Pepe <span className="text-gray-400">(Hiari)</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="mteja@biashara.co.tz"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Simu <span className="text-gray-400">(Hiari)</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+255 712 345 678"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Maelezo</h3>
                  <p className="text-sm text-gray-500">Anwani, mji na aina ya mteja</p>
                </div>
              </div>
              <div className="space-y-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      Mji <span className="text-gray-400">(Hiari)</span>
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Dar es Salaam"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerType" className="text-sm font-medium">
                      Aina ya Mteja <span className="text-gray-400">(Hiari)</span>
                    </Label>
                    <select
                      id="customerType"
                      name="customerType"
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Chagua aina</option>
                      {CUSTOMER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 2 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <Settings2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mipangilio</h3>
                  <p className="text-sm text-gray-500">Kikundi, kikomo cha mikopo na hali</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerGroupId" className="text-sm font-medium">
                    Kikundi <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <select
                    id="customerGroupId"
                    name="customerGroupId"
                    className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Hakuna kikundi</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditLimit" className="text-sm font-medium">
                    Kikomo cha Mikopo <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="creditLimit"
                    name="creditLimit"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    placeholder="0.00"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    value="true"
                    defaultChecked
                    className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Inatumika</span>
                    <p className="text-xs text-gray-500">Mteja huyu anapatikana kwa matumizi</p>
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
                {pending ? "Inahifadhi..." : "Hifadhi Mteja"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
