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
    const { wrapEmailHtml } = await import("@/notifications/email/services/email-wrapper");

    const body = `
      <div style="text-align:center">
        <div style="width:48px;height:48px;margin:0 auto 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center">
          <span style="color:#fff;font-size:24px;line-height:1">&#x1F512;</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b">Password Reset</h1>
        <p style="margin:0 0 4px;font-size:15px;color:#64748b">Use the code below to reset your password.</p>
        <p style="margin:0 0 24px;font-size:13px;color:#94a3b8">This code expires in <strong>15 minutes</strong>.</p>
        <div style="display:inline-block;padding:16px 32px;background:#f1f5f9;border-radius:12px;border:2px dashed #cbd5e1;margin:0 auto 24px">
          <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#1e293b;font-family:ui-monospace,monospace">${otp}</span>
        </div>
        <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;margin:0 auto 8px;max-width:360px">
          <p style="margin:0;font-size:13px;color:#dc2626">
            If you did not request a password reset, please ignore this email or contact support.
          </p>
        </div>
      </div>
    `;

    await sendEmailWithDefaultConfig({
      to: user.email,
      subject: "Your password reset code — Enkai Business",
      html: wrapEmailHtml(body, { title: "Password Reset" }),
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
