"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form";

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <FormField label="New password" required>
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
          <Button type="submit" className="w-full">
            Reset password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
