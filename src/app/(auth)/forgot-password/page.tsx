"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, Mail, ArrowLeft, CheckCircle, KeyRound, Lock } from "lucide-react";
import { requestPasswordResetOTPAction, verifyOTPAndResetPasswordAction } from "@/features/auth/actions/password-reset-actions";

type Step = "email" | "otp" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSendOTP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const emailVal = formData.get("email") as string;

    if (!emailVal) {
      setError("Please enter your email address");
      setPending(false);
      return;
    }

    const res = await requestPasswordResetOTPAction(emailVal);
    if (!res.success) {
      setError(res.message);
      setPending(false);
      return;
    }

    setEmail(emailVal);
    setStep("otp");
    setPending(false);
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const otp = formData.get("otp") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP code");
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPending(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setPending(false);
      return;
    }

    const res = await verifyOTPAndResetPasswordAction(email, otp, password);
    if (!res.success) {
      setError(res.message);
      setPending(false);
      return;
    }

    setStep("done");
    setPending(false);
  }

  if (step === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-0 shadow-xl sm:border">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            </motion.div>
            <CardTitle className="text-xl font-bold">Password reset</CardTitle>
            <CardDescription>
              Your password has been reset successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Sign in with new password
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      key={step}
    >
      <Card className="border-0 shadow-xl sm:border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {step === "email" ? "Forgot password?" : "Enter reset code"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a reset code"
              : `A 6-digit code was sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <FormError message={error || undefined} />

              <FormField label="Email" required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="pl-9"
                    required
                  />
                </div>
              </FormField>

              <Button type="submit" className="w-full gap-2" disabled={pending} size="lg">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset code"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <FormError message={error || undefined} />

              <FormField label="OTP code" required>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    name="otp"
                    placeholder="000000"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    className="pl-9 text-center text-xl tracking-[8px]"
                    required
                  />
                </div>
              </FormField>

              <FormField label="New password" required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <PasswordInput
                    name="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className="pl-9"
                    required
                  />
                </div>
              </FormField>

              <FormField label="Confirm password" required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <PasswordInput
                    name="confirmPassword"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="pl-9"
                    required
                  />
                </div>
              </FormField>

              <Button type="submit" className="w-full gap-2" disabled={pending} size="lg">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
