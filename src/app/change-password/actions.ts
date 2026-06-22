"use server";

import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireAuth();

    if (!currentPassword || !newPassword) {
      return { success: false, message: "Current password and new password are required" };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters" };
    }

    const { verifyPassword, hashPassword } = await import("@better-auth/utils/password");

    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });

    if (!account?.password) {
      return { success: false, message: "No credential account found" };
    }

    const isValid = await verifyPassword(account.password, currentPassword);
    if (!isValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    const hash = await hashPassword(newPassword);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hash },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { mustChangePassword: false, isOnboarded: true },
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, message: "Failed to change password" };
  }
}
