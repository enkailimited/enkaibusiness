import "server-only";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { ActionResponse } from "@/types/relationships";

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function requestPasswordResetOTP(email: string): Promise<ActionResponse> {
  if (!email?.includes("@")) {
    return { success: false, message: "Invalid email address" };
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, email: true } });
  if (!user) {
    return { success: true, message: "If an account exists with this email, an OTP has been sent." };
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.verification.deleteMany({
    where: { identifier: user.email },
  });

  await prisma.verification.create({
    data: {
      identifier: user.email,
      value: otp,
      expiresAt,
    },
  });

  try {
    const { sendEmailWithDefaultConfig } = await import("@/notifications/email/services/smtp-service");
    await sendEmailWithDefaultConfig({
      to: user.email,
      subject: "Your password reset code",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Password Reset</h2>
        <p>Use this code to reset your password. It expires in 15 minutes.</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f4f4f5;border-radius:8px;margin:24px 0;">${otp}</div>
        <p style="color:#71717a;font-size:14px;">If you did not request this, ignore this email.</p>
      </div>`,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
  }

  return { success: true, message: "If an account exists with this email, an OTP has been sent." };
}

export async function verifyOTPAndResetPassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<ActionResponse> {
  if (!email?.includes("@")) {
    return { success: false, message: "Invalid email address" };
  }
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { success: false, message: "Invalid OTP code" };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: "Password must be at least 8 characters" };
  }

  const verification = await prisma.verification.findFirst({
    where: {
      identifier: email.toLowerCase(),
      value: otp,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    return { success: false, message: "Invalid or expired OTP code" };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!user) {
    return { success: false, message: "User not found" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: hashedPassword },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { mustChangePassword: false },
    }),
    prisma.verification.delete({ where: { id: verification.id } }),
  ]);

  return { success: true, message: "Password reset successfully. You can now sign in." };
}
