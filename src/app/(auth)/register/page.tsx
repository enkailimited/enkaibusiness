"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { normalizePhone } from "@/lib/phone";
import { createMyWorkspaceAction } from "@/features/workspaces/actions";
import {
  Loader2, UserPlus, ChevronRight, ChevronLeft, Check, User, Shield, FileText,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Security", icon: Shield },
  { id: 3, label: "Terms", icon: FileText },
];

const stepLabels = [
  { title: "Create your account", subtitle: "Tell us about yourself" },
  { title: "Secure your account", subtitle: "Set up login credentials" },
  { title: "Almost there", subtitle: "Review and agree to terms" },
] as const;

function getStepLabel(step: number) {
  return stepLabels[step - 1] ?? stepLabels[0];
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function canProceedToStep2() {
    return formData.firstName.trim() && formData.lastName.trim() && formData.email.trim();
  }

  function canProceedToStep3() {
    return formData.password.length >= 8 && formData.password === formData.confirmPassword;
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      setPending(false);
      return;
    }

    const normalizedPhone = normalizePhone(formData.phone) || "";

    const { error: signUpError } = await authClient.signUp.email({
      email: formData.email,
      password: formData.password,
      name: `${formData.firstName} ${formData.lastName}`,
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      ...(formData.username ? { username: formData.username } : {}),
      firstName: formData.firstName,
      lastName: formData.lastName,
    } as Parameters<typeof authClient.signUp.email>[0]);

    if (signUpError) {
      setError(signUpError.message || "Failed to create account");
      setPending(false);
      return;
    }

    // Wait briefly for session cookie to propagate after signup
    await new Promise((r) => setTimeout(r, 500));

    // Retry workspace creation once if it fails (session may not be ready)
    let wsCreated = false;
    try {
      const wsResult = await createMyWorkspaceAction();
      wsCreated = wsResult?.success === true;
    } catch {
      // retry once after a short delay
      try {
        await new Promise((r) => setTimeout(r, 1000));
        const wsResult = await createMyWorkspaceAction();
        wsCreated = wsResult?.success === true;
      } catch {
        // workspace creation is best-effort during signup
      }
    }

    setPending(false);

    try { sessionStorage.setItem("firdaus_greet", "true"); } catch {}
    router.push(wsCreated ? "/workspaces/dashboard" : "/");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-xl sm:border">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex items-center justify-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 w-10 transition-colors duration-300 ${
                      step > s.id ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardTitle className="text-xl font-bold tracking-tight">
              {getStepLabel(step).title}
            </CardTitle>
            <CardDescription>
              {getStepLabel(step).subtitle}
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent>
          <FormError message={error || undefined} />

          <div className="relative min-h-[260px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="First name" required>
                      <Input
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        required
                      />
                    </FormField>
                    <FormField label="Last name" required>
                      <Input
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        required
                      />
                    </FormField>
                  </div>
                  <FormField label="Email" required>
                    <Input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </FormField>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <FormField label="Phone (optional)">
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="+255 712 345 678"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Username (optional)">
                    <Input
                      name="username"
                      placeholder="your-username"
                      value={formData.username}
                      onChange={(e) => updateField("username", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Password" required>
                    <PasswordInput
                      name="password"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="Confirm password" required>
                    <PasswordInput
                      name="confirmPassword"
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      required
                    />
                  </FormField>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Name</span>
                        <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Email</span>
                        <p className="font-medium truncate">{formData.email}</p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  <Button
                    type="button"
                    className="w-full gap-2"
                    disabled={pending || !agreeTerms}
                    size="lg"
                    onClick={handleSubmit}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Create account
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 && (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedToStep2()) ||
                  (step === 2 && !canProceedToStep3())
                }
                className="gap-1"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
