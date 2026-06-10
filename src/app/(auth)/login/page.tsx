"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form";
import { signIn } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const { error: signInError } = await signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (signInError) {
      setError(signInError.message || "Invalid email or password");
      setPending(false);
      return;
    }

    router.push("/platform/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error || undefined} />

          <FormField label="Email" required>
            <Input
              type="email"
              name="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </FormField>

          <FormField label="Password" required>
            <Input
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </FormField>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
