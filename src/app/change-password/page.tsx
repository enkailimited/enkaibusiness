"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form";
import { changePasswordAction } from "./actions";
import { Lock, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setPending(false);
      return;
    }

    try {
      const result = await changePasswordAction(currentPassword, newPassword);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/platform/dashboard"), 2000);
      } else {
        setError(result.message);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl sm:border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Password Changed!</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been updated successfully. Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl sm:border">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
          <CardDescription>
            You need to change your password before continuing. Use your temporary password to set a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormError message={error || undefined} />

            <FormField label="Current Password" required>
              <PasswordInput
                name="currentPassword"
                placeholder="Enter your current password"
                autoComplete="current-password"
                required
              />
            </FormField>

            <FormField label="New Password" required>
              <PasswordInput
                name="newPassword"
                placeholder="Enter new password"
                autoComplete="new-password"
                required
              />
            </FormField>

            <FormField label="Confirm New Password" required>
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
              />
            </FormField>

            <Button type="submit" className="w-full gap-2" disabled={pending} size="lg">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  Change Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
