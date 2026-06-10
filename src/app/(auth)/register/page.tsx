"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPending(false);
      return;
    }

    const { error: signUpError } = await authClient.signUp.email({
      email: formData.get("email") as string,
      password,
      name: `${formData.get("firstName")} ${formData.get("lastName")}`,
    });

    if (signUpError) {
      setError(signUpError.message || "Failed to create account");
      setPending(false);
      return;
    }

    router.push("/platform/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error || undefined} />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="First name" required>
              <Input name="firstName" placeholder="John" required />
            </FormField>
            <FormField label="Last name" required>
              <Input name="lastName" placeholder="Doe" required />
            </FormField>
          </div>

          <FormField label="Email" required>
            <Input
              type="email"
              name="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </FormField>

          <FormField label="Phone (optional)">
            <Input type="tel" name="phone" placeholder="+255 712 345 678" />
          </FormField>

          <FormField label="Password" required>
            <Input
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
            />
          </FormField>

          <FormField label="Confirm password" required>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </FormField>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
