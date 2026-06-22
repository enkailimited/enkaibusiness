"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { getPlatformRolesAction, getBusinessRolesAction } from "@/features/roles/actions";
import { inviteUserWithStaffAction } from "@/features/users/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Check, User, Phone, AtSign, Hash, Contact, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";

interface UserInviteFormProps {
  businessId?: string;
}

interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

const genderOptions = [
  { value: "MALE", label: "Male", icon: Contact },
  { value: "FEMALE", label: "Female", icon: Contact },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === current ? "w-6 bg-primary" : i < current ? "w-2 bg-primary/50" : "w-2 bg-muted",
          )}
        />
      ))}
    </div>
  );
}

export function UserInviteForm({ businessId }: UserInviteFormProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [allowSubmit, setAllowSubmit] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(
    inviteUserWithStaffAction,
    null,
  );

  useEffect(() => {
    const fetchRoles = businessId ? getBusinessRolesAction() : getPlatformRolesAction();
    fetchRoles
      .then((data) => setRoles(data as RoleOption[]))
      .finally(() => setRolesLoading(false));
  }, [businessId]);

  // Reset form after successful submission
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setStep(0);
        setSelectedGender("");
        setSelectedRole("");
        setAllowSubmit(false);
        if (formRef.current) formRef.current.reset();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  function canProceed(): boolean {
    if (step === 1) return !!selectedGender;
    return true;
  }

  function handleNext() {
    if (step < 2) setStep((s) => Math.min(s + 1, 2));
  }

  function handleFinalSubmit() {
    // Allow the form to submit on next submission attempt
    setAllowSubmit(true);
    // Trigger form submission programmatically
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }, 0);
  }

  function handleSubmit(e: React.FormEvent) {
    // Only allow submission if we're on step 2 AND allowSubmit is true
    if (step < 2 || !allowSubmit) {
      e.preventDefault();
      return;
    }
    // Reset allowSubmit flag
    setAllowSubmit(false);
    // Let the form submit to formAction
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite User</CardTitle>
        <CardDescription>Create a user and send an invitation email</CardDescription>
        <div className="pt-3">
          <StepIndicator current={step} total={3} />
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
          {businessId && <input type="hidden" name="businessId" value={businessId} />}
          <input type="hidden" name="gender" value={selectedGender} />
          <input type="hidden" name="roleId" value={selectedRole} />

          <div className={step !== 0 ? "hidden" : ""}>
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                <User className="h-4 w-4" />
                Personal Information
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    required 
                    autoComplete="given-name"
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    required 
                    autoComplete="family-name"
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <AtSign className="mr-1 inline h-3 w-3" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  autoComplete="email"
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="mr-1 inline h-3 w-3" />
                    Phone
                  </Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    autoComplete="tel" 
                    required
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">
                    <Hash className="mr-1 inline h-3 w-3" />
                    Username
                  </Label>
                  <Input 
                    id="username" 
                    name="username" 
                    autoComplete="username" 
                    required
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={step !== 1 ? "hidden" : ""}>
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                <Contact className="h-4 w-4" />
                Select Gender
              </div>
              <div className="grid grid-cols-2 gap-3">
                {genderOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedGender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedGender(opt.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted bg-card hover:border-muted-foreground/30",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                          isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={step !== 2 ? "hidden" : ""}>
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                <ShieldCheck className="h-4 w-4" />
                Assign Role
              </div>
              {rolesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("")}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200",
                      !selectedRole
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted bg-card hover:border-muted-foreground/30",
                    )}
                  >
                    {!selectedRole && (
                      <div className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        !selectedRole ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Hash className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold text-center leading-tight",
                        !selectedRole ? "text-primary" : "text-foreground",
                      )}
                    >
                      No role
                    </span>
                  </button>
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
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-muted bg-card hover:border-muted-foreground/30",
                        )}
                      >
                        {isSelected && (
                          <div className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-2 w-2 text-primary-foreground" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-semibold text-center leading-tight",
                            isSelected ? "text-primary" : "text-foreground",
                          )}
                        >
                          {role.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground leading-tight">{role.slug}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {step === 2 && state?.success === false && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          {step === 2 && state?.success && (
            <p className="text-sm text-emerald-600">{state.message}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              {step > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div>
              {step < 2 ? (
                <Button type="button" size="sm" onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleFinalSubmit} disabled={pending}>
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending invite...
                    </>
                  ) : (
                    "Send Invite"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
