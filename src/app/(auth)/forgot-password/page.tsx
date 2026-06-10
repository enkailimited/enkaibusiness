"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription>Enter your email to reset your password</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <FormField label="Email" required>
            <Input
              type="email"
              name="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </FormField>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
