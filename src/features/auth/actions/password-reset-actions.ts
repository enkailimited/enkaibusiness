"use server";

import { requestPasswordResetOTP, verifyOTPAndResetPassword } from "@/features/auth/services/otp-reset-service";
import type { ActionResponse } from "@/types/relationships";

export async function requestPasswordResetOTPAction(email: string): Promise<ActionResponse> {
  return requestPasswordResetOTP(email);
}

export async function verifyOTPAndResetPasswordAction(
  email: string,
  otp: string,
  newPassword: string,
): Promise<ActionResponse> {
  return verifyOTPAndResetPassword(email, otp, newPassword);
}
