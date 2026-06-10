import * as React from "react";
import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </div>
  );
}

interface FormSuccessProps {
  message?: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
      {message}
    </div>
  );
}
