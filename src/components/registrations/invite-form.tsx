"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Users, Building2, Briefcase, Target } from "lucide-react";
import { StepIndicator } from "./step-indicator";
import { PersonalInfoStep } from "./personal-info-step";
import { GenderSelectStep } from "./gender-select-step";
import { RoleAssignStep, type RoleOption } from "./role-assign-step";
import type { ActionResponse } from "@/types/relationships";

export type InviteContext = "platform" | "workspace" | "business" | "sales_team";

interface InviteFormProps {
  context: InviteContext;
  action: (prevState: ActionResponse | null, formData: FormData) => Promise<ActionResponse | null>;
  businessId?: string;
  roles?: RoleOption[];
  rolesLoading?: boolean;
  hierarchyId?: string;
  hierarchyOptions?: { id: string; title: string; slug: string }[];
  hierarchyLoading?: boolean;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

const contextIcons: Record<InviteContext, React.ReactNode> = {
  platform: <Users className="h-4 w-4" />,
  workspace: <Building2 className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
  sales_team: <Target className="h-4 w-4" />,
};

const contextTitles: Record<InviteContext, string> = {
  platform: "Invite Platform User",
  workspace: "Invite Workspace Member",
  business: "Invite Business Staff",
  sales_team: "Invite Sales Team Member",
};

const contextDescriptions: Record<InviteContext, string> = {
  platform: "Create a platform user and send an invitation email",
  workspace: "Add a member to the workspace",
  business: "Create a staff member and send an invitation email",
  sales_team: "Add a team member to the sales network",
};

export function InviteForm({
  context,
  action,
  businessId,
  roles = [],
  rolesLoading = false,
  hierarchyOptions = [],
  hierarchyLoading = false,
  onSuccess,
  title,
  description,
}: InviteFormProps) {
  const [step, setStep] = useState(0);
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedHierarchy, setSelectedHierarchy] = useState("");
  const [allowSubmit, setAllowSubmit] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setStep(0);
        setSelectedGender("");
        setSelectedRole("");
        setSelectedHierarchy("");
        setAllowSubmit(false);
        if (formRef.current) formRef.current.reset();
        onSuccess?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, onSuccess]);

  const totalSteps = context === "business" ? 3 : 3;

  function canProceed(): boolean {
    if (step === 1) return !!selectedGender;
    return true;
  }

  function handleNext() {
    if (step < 2) setStep((s) => Math.min(s + 1, 2));
  }

  function handleFinalSubmit() {
    setAllowSubmit(true);
    setTimeout(() => {
      if (formRef.current) formRef.current.requestSubmit();
    }, 0);
  }

  function handleSubmit(e: React.FormEvent) {
    if (step < 2 || !allowSubmit) {
      e.preventDefault();
      return;
    }
    setAllowSubmit(false);
  }

  const renderRoleStep = () => {
    if (context === "sales_team") {
      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Target className="h-4 w-4" />
            Sales Role
          </div>
          {hierarchyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {hierarchyOptions.map((h) => {
                const isSelected = selectedHierarchy === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedHierarchy(h.id)}
                    className="relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 border-muted bg-card hover:border-muted-foreground/30 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5 data-[selected=true]:shadow-sm"
                    data-selected={isSelected}
                  >
                    <span className="text-xs font-semibold text-center">{h.title}</span>
                    <span className="text-[9px] text-muted-foreground">{h.slug}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <RoleAssignStep
        roles={roles}
        loading={rolesLoading}
        value={selectedRole}
        onChange={setSelectedRole}
        allowNoRole={context !== "workspace"}
        icon={contextIcons[context]}
        title={context === "platform" ? "Platform Role" : "Business Role"}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || contextTitles[context]}</CardTitle>
        <CardDescription>{description || contextDescriptions[context]}</CardDescription>
        <div className="pt-3">
          <StepIndicator current={step} total={totalSteps} />
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
          {businessId && <input type="hidden" name="businessId" value={businessId} />}
          <input type="hidden" name="gender" value={selectedGender} />
          <input type="hidden" name="roleId" value={selectedRole} />
          <input type="hidden" name="hierarchyId" value={selectedHierarchy} />

          <div className={step !== 0 ? "hidden" : ""}>
            <PersonalInfoStep />
          </div>

          <div className={step !== 1 ? "hidden" : ""}>
            <GenderSelectStep value={selectedGender} onChange={setSelectedGender} />
          </div>

          <div className={step !== 2 ? "hidden" : ""}>
            {renderRoleStep()}
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
