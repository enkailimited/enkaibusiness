import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { forgotPasswordSchema, resetPasswordSchema } from "@/features/auth/schemas";
import type { ActionResponse } from "@/types/relationships";

export async function requestPasswordReset(email: string): Promise<ActionResponse> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid email address",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email },
      headers: await headers(),
    });

    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    };
  } catch {
    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    };
  }
}

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<ActionResponse> {
  const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password },
      query: { token: parsed.data.token },
      headers: await headers(),
    });

    return { success: true, message: "Password reset successfully. You can now sign in." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Password reset failed";
    return { success: false, message: msg };
  }
}
