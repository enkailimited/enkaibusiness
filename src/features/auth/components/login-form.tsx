"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Mail, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const identifier = (formData.get("identifier") as string).trim();
    const password = formData.get("password") as string;

    if (!identifier) {
      setError("Please enter your email, phone, or username");
      setPending(false);
      return;
    }

    const { error: signInError } = await authClient.signIn.email({
      email: identifier,
      password,
      rememberMe: true,
    });

    if (signInError) {
      const msg =
        signInError.message?.toLowerCase().includes("invalid") ||
        signInError.message?.toLowerCase().includes("no user")
          ? "Invalid email, phone/username, or password"
          : signInError.message || "Failed to sign in";
      setError(msg);
      setPending(false);
      return;
    }

    router.push("/platform/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your email, phone, or username to sign in</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormField label="Email, Phone, or Username" required>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="identifier"
                placeholder="you@example.com"
                autoComplete="email"
                className="pl-9"
                required
              />
            </div>
          </FormField>
          <FormField label="Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <PasswordInput
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className="pl-9"
                required
              />
            </div>
          </FormField>
          <FormError message={error || undefined} />
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
