"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createStaffAction, updateStaffAction } from "../actions";
import { ChevronLeft, ChevronRight, Users, Briefcase } from "lucide-react";
import type { StaffWithUser } from "../types";

interface StaffFormProps {
  businessId: string;
  staff?: StaffWithUser;
  onSuccess?: () => void;
}

const STEPS = [
  { title: "Basic Info", description: "User and employee code" },
  { title: "Job", description: "Position and hire date" },
];

export function StaffForm({ businessId, staff, onSuccess }: StaffFormProps) {
  const [step, setStep] = useState(0);
  const formActionRef = useMemo(
    () => (staff ? updateStaffAction.bind(null, staff.id) : createStaffAction),
    [staff],
  );
  const [state, formAction, pending] = useActionState(formActionRef, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          {!staff && <input type="hidden" name="businessId" value={businessId} />}

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Basic Info</h3>
                  <p className="text-sm text-gray-500">User and employee code</p>
                </div>
              </div>
              <div className="space-y-4">
                {!staff && (
                  <div className="space-y-2">
                    <Label htmlFor="userId" className="text-sm font-medium">
                      User <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="userId"
                      name="userId"
                      required
                      placeholder="Enter user ID"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {state?.errors?.userId && (
                      <p className="text-sm text-red-500">{state.errors.userId[0]}</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="employeeCode" className="text-sm font-medium">
                    Employee Code <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="employeeCode"
                    name="employeeCode"
                    defaultValue={staff?.employeeCode ?? ""}
                    placeholder="e.g. EMP-001"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {state?.errors?.employeeCode && (
                    <p className="text-sm text-red-500">{state.errors.employeeCode[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Job</h3>
                  <p className="text-sm text-gray-500">Position and hire date</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">
                    Position <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="position"
                    name="position"
                    defaultValue={staff?.position ?? ""}
                    placeholder="e.g. Cashier"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {state?.errors?.position && (
                    <p className="text-sm text-red-500">{state.errors.position[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate" className="text-sm font-medium">
                    Hire Date <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="hireDate"
                    name="hireDate"
                    type="date"
                    defaultValue={staff?.hireDate ? new Date(staff.hireDate).toISOString().split("T")[0] : ""}
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {state?.errors?.hireDate && (
                    <p className="text-sm text-red-500">{state.errors.hireDate[0]}</p>
                  )}
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

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
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
                className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {pending ? "Saving..." : staff ? "Update Staff" : "Save Staff"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
