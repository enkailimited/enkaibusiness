import "server-only";
import { prisma } from "@/server/db";
import { randomBytes } from "crypto";

export function generateTempPassword(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `ENK-${part()}-${part()}`;
}

export function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export async function setUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const { hashPassword } = await import("@better-auth/utils/password");
    const hash = await hashPassword(newPassword);

    const existing = await prisma.account.findFirst({
      where: { userId, providerId: "credential" },
    });

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: { password: hash },
      });
    } else {
      await prisma.account.create({
        data: {
          id: `cred-${userId}`,
          userId,
          providerId: "credential",
          accountId: userId,
          password: hash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return true;
  } catch (err) {
    console.error("Failed to set user password:", err);
    return false;
  }
}

async function buildInviteEmailPayload(
  toEmail: string,
  tempPassword: string,
  invitedByName: string,
  businessName: string,
  isReinvite: boolean,
) {
  const { sendEmailWithDefaultConfig } = await import("@/notifications/email/services/smtp-service");
  const { renderTemplate, SYSTEM_TEMPLATES } = await import("@/notifications/email/services/template-service");

  const tpl = (SYSTEM_TEMPLATES.find((t) => t.slug === "staff-invitation") || SYSTEM_TEMPLATES[0]) as unknown as {
    subject: string;
    htmlContent: string;
    plainTextContent?: string | null;
  };
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/login`;
  const changePasswordUrl = `${baseUrl}/change-password`;

  const rendered = await renderTemplate(tpl, {
    businessName,
    inviteUrl: `${baseUrl}/login?invite=pending`,
    invitedBy: invitedByName,
    loginUrl,
    temporaryPassword: tempPassword,
    email: toEmail,
    username: toEmail,
    changePasswordUrl,
  });

  return {
    sendEmailWithDefaultConfig,
    options: {
      to: toEmail,
      subject: isReinvite ? "Re-invitation to Enkai Business" : "Invitation to Enkai Business",
      html: rendered.html,
      text: rendered.text,
    },
  };
}

export async function sendInviteEmail(
  toEmail: string,
  tempPassword: string,
  invitedByName: string,
  businessName: string,
  isReinvite: boolean,
): Promise<boolean> {
  try {
    const { sendEmailWithDefaultConfig, options } = await buildInviteEmailPayload(
      toEmail, tempPassword, invitedByName, businessName, isReinvite,
    );
    const result = await sendEmailWithDefaultConfig(options);
    return result.success;
  } catch (err) {
    console.error("Failed to send invite email:", err);
    return false;
  }
}

export async function sendInviteEmailAsync(
  toEmail: string,
  tempPassword: string,
  invitedByName: string,
  businessName: string,
  isReinvite: boolean,
): Promise<void> {
  buildInviteEmailPayload(toEmail, tempPassword, invitedByName, businessName, isReinvite)
    .then(async ({ sendEmailWithDefaultConfig, options }) => {
      const result = await sendEmailWithDefaultConfig(options);
      if (result.success) {
        console.log("[INVITE] Re-invitation email sent asynchronously to", toEmail, "messageId:", result.messageId);
      } else {
        console.error("[INVITE] Re-invitation email failed asynchronously for", toEmail, "error:", result.error, "category:", result.errorCategory);
      }
    })
    .catch((err) => {
      console.error("[INVITE] Failed to send re-invitation email asynchronously for", toEmail, ":", err);
    });
}

export async function createUserInvite(
  userId: string,
  email: string,
  phone: string | null,
  invitedById: string,
): Promise<{ inviteToken: string; expiresAt: Date }> {
  const inviteToken = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.userInvite.create({
    data: {
      userId,
      email,
      phone: phone || null,
      invitedById,
      inviteToken,
      status: "PENDING",
      expiresAt,
    },
  });

  return { inviteToken, expiresAt };
}
