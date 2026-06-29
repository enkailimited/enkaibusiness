"use client";

import { cn } from "@/lib/utils";
import { useState, useActionState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { updateStaffAction } from "../actions";
import { inviteUserWithStaffAction } from "@/features/users/actions";
import { getBusinessRolesAction } from "@/features/roles/actions";
import { ChevronLeft, ChevronRight, Briefcase, User, AtSign, Phone, Hash, ShieldCheck } from "lucide-react";
import type { StaffWithUser } from "../types";
import type { ActionResponse } from "@/types/relationships";

interface StaffFormProps {
  businessId: string;
  staff?: StaffWithUser;
  onSuccess?: () => void;
}

interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

const CREATE_STEPS = [
  { title: "Personal Info", description: "Name, email and phone" },
  { title: "Gender & Role", description: "Gender and platform role" },
  { title: "Staff Details", description: "Position and employee code" },
];

export function StaffForm({ businessId, staff, onSuccess }: StaffFormProps) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const [allowSubmit, setAllowSubmit] = useState(false);

  const isEdit = !!staff;

  const actionRef = useMemo(
    () => (isEdit ? updateStaffAction.bind(null, staff!.id) : inviteUserWithStaffAction),
    [isEdit, staff?.id],
  );

  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(actionRef, null);

  useEffect(() => {
    if (!isEdit) {
      getBusinessRolesAction()
        .then((data) => setRoles(data as RoleOption[]))
        .finally(() => setRolesLoading(false));
    }
  }, [isEdit]);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  function canProceed(): boolean {
    if (step === 0) return !!firstName && !!lastName && !!email && !!phone && !!username;
    if (step === 1) return !!selectedGender;
    return true;
  }

  function handleFinalSubmit() {
    setAllowSubmit(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }, 0);
  }

  function handleFormSubmit(e: React.FormEvent) {
    if (!isEdit && (step < CREATE_STEPS.length - 1 || !allowSubmit)) {
      e.preventDefault();
      return;
    }
    setAllowSubmit(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") e.preventDefault();
  }

  // Edit mode: simple single-step form
  if (isEdit) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <form action={formAction} className="space-y-6" onKeyDown={handleKeyDown}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Edit Staff</h3>
                  <p className="text-sm text-gray-500">{staff.user.firstName} {staff.user.lastName}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="firstName" name="firstName" defaultValue={staff?.user.firstName ?? ""}
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      onKeyDown={handleKeyDown} />
                    {state?.errors?.firstName && (
                      <p className="text-sm text-red-500">{state.errors.firstName[0]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="lastName" name="lastName" defaultValue={staff?.user.lastName ?? ""}
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      onKeyDown={handleKeyDown} />
                    {state?.errors?.lastName && (
                      <p className="text-sm text-red-500">{state.errors.lastName[0]}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="email" name="email" type="email" defaultValue={staff?.user.email ?? ""}
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    onKeyDown={handleKeyDown} />
                  {state?.errors?.email && (
                    <p className="text-sm text-red-500">{state.errors.email[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={staff?.user.phone ?? ""}
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    onKeyDown={handleKeyDown} />
                  {state?.errors?.phone && (
                    <p className="text-sm text-red-500">{state.errors.phone[0]}</p>
                  )}
                </div>
                <hr className="border-gray-100" />
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
                    onKeyDown={handleKeyDown}
                  />
                  {state?.errors?.employeeCode && (
                    <p className="text-sm text-red-500">{state.errors.employeeCode[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">
                    Position <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="position"
                    name="position"
                    defaultValue={staff?.position ?? ""}
                    placeholder="e.g. Cashier"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
                  />
                  {state?.errors?.hireDate && (
                    <p className="text-sm text-red-500">{state.errors.hireDate[0]}</p>
                  )}
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
              </div>
            )}

            <div className="flex items-center justify-end border-t border-gray-100 pt-6">
              <Button
                type="submit"
                disabled={pending}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {pending ? "Saving..." : "Update Staff"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Create mode: multi-step invite form
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={CREATE_STEPS} currentStep={step} />
        <form ref={formRef} action={formAction} onSubmit={handleFormSubmit} noValidate className="space-y-6" onKeyDown={handleKeyDown}>
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="firstName" value={firstName} />
          <input type="hidden" name="lastName" value={lastName} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="gender" value={selectedGender} />
          <input type="hidden" name="roleId" value={selectedRole} />

          {/* Step 1: Personal Info */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Personal Info</h3>
                  <p className="text-sm text-gray-500">Name, email and phone</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="firstName" name="firstName" required autoComplete="given-name" onKeyDown={handleKeyDown}
                    value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="lastName" name="lastName" required autoComplete="family-name" onKeyDown={handleKeyDown}
                    value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  <AtSign className="mr-1 inline h-3 w-3" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input id="email" name="email" type="email" required autoComplete="email" onKeyDown={handleKeyDown}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    <Phone className="mr-1 inline h-3 w-3" />
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input id="phone" name="phone" type="tel" autoComplete="tel" required onKeyDown={handleKeyDown}
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    <Hash className="mr-1 inline h-3 w-3" />
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input id="username" name="username" autoComplete="username" required onKeyDown={handleKeyDown}
                    value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Gender & Role */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gender & Role</h3>
                  <p className="text-sm text-gray-500">Gender and platform role</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Gender <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  {["MALE", "FEMALE"].map((opt) => {
                    const isSelected = selectedGender === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedGender(opt)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300",
                        )}
                      >
                        <span className={cn("text-sm font-semibold", isSelected ? "text-blue-600" : "text-gray-700")}>
                          {opt === "MALE" ? "Male" : "Female"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Business Role <span className="text-gray-400">(Optional)</span>
                </Label>
                {rolesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {roles.map((role) => {
                      const isSelected = selectedRole === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRole(role.id)}
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200",
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-gray-300",
                          )}
                        >
                          <span className={cn("text-xs font-semibold", isSelected ? "text-blue-600" : "text-gray-700")}>
                            {role.name}
                          </span>
                          <span className="text-[10px] text-gray-400">{role.slug}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Staff Details */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Staff Details</h3>
                  <p className="text-sm text-gray-500">Position and employee code</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCode" className="text-sm font-medium">
                    Employee Code <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="employeeCode" name="employeeCode"
                    placeholder="e.g. EMP-001"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">
                    Position <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="position" name="position"
                    placeholder="e.g. Cashier" required
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate" className="text-sm font-medium">
                    Hire Date <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="hireDate" name="hireDate" type="date"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && state?.message && (
            <div
              className={`rounded-xl p-4 text-sm ${
                state.success
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
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
              Back
            </Button>

            {step < CREATE_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
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
                {pending ? "Sending Invite..." : "Send Invite"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
