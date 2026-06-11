"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { registerSchema, type RegisterSchema } from "@/features/auth/schemas";
import { registerAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterSchema>();

  const mutation = useMutation({
    mutationFn: async (data: RegisterSchema) => {
      const parsed = registerSchema.safeParse(data);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        for (const [field, msgs] of Object.entries(fieldErrors)) {
          if (msgs) {
            setError(field as keyof RegisterSchema, { message: msgs[0] });
          }
        }
        throw new Error("Validation failed");
      }
      return registerAction(parsed.data);
    },
    onSuccess: (result) => {
      if (!result.success) {
        setFormError(result.message);
        if (result.errors) {
          for (const [field, msgs] of Object.entries(result.errors)) {
            if (msgs) {
              setError(field as keyof RegisterSchema, { message: msgs[0] });
            }
          }
        }
      }
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Fill in the details to create your account</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <FormField label="First Name" error={errors.firstName} required>
            <Input
              placeholder="John"
              {...register("firstName")}
            />
          </FormField>
          <FormField label="Last Name" error={errors.lastName} required>
            <Input
              placeholder="Doe"
              {...register("lastName")}
            />
          </FormField>
          <FormField label="Email" error={errors.email} required>
            <Input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <Input
              type="tel"
              placeholder="+255123456789"
              {...register("phone")}
            />
          </FormField>
          <FormField label="Password" error={errors.password} required>
            <PasswordInput
              placeholder="Min. 8 characters"
              {...register("password")}
            />
          </FormField>
          <FormField label="Confirm Password" error={errors.confirmPassword} required>
            <PasswordInput
              placeholder="Repeat your password"
              {...register("confirmPassword")}
            />
          </FormField>
          <FormError message={formError || undefined} />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
