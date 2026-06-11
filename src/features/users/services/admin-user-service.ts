import "server-only";

import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import { createNotification } from "@/features/notifications/services/notification-service";
import { recordActivity } from "@/features/activities/services/activity-service";
import { recordAuditLog } from "@/features/audit-logs/services/audit-service";
import { getBusiness } from "@/server/services/business-service";

interface CreateInvitedUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  username?: string | null;
  gender?: string | null;
  businessId?: string | null;
  branchId?: string | null;
  storeId?: string | null;
  roleId?: string | null;
  position?: string | null;
}

function generateTempPassword(): string {
  // ENK-XXXX-YYYY pattern
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `ENK-${part()}-${part()}`;
}

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export async function createInvitedUserWithStaff(
  invitedById: string,
  input: CreateInvitedUserInput,
): Promise<ActionResponse & { data?: { userId: string; staffId?: string } }> {
  try {
    const existing = await prisma.user.findFirst({ where: { email: input.email } });
    if (existing) {
      return { success: false, message: "User with this email already exists" };
    }

    const tempPassword = generateTempPassword();

    // Create auth user via Better Auth
    const hdrs = await headers();
    const res = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: tempPassword,
        name: `${input.firstName} ${input.lastName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        gender: input.gender || null,
      },
      headers: hdrs,
    } as Parameters<typeof auth.api.signUpEmail>[0]);

    if (!res || (res as any).error) {
      return { success: false, message: "Failed to create auth user" };
    }

    // Fetch created user from DB
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      return { success: false, message: "User could not be loaded after creation" };
    }

    const businessId = input.businessId ?? null;

    const [updatedUser, staff, invite] = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
          username: input.username || null,
          gender: input.gender || null,
          isOnboarded: false,
        },
      });

      // Assign role via UserRole so permissions are picked up
      if (input.roleId) {
        await tx.userRole.upsert({
          where: {
            userId_roleId_businessId: {
              userId: u.id,
              roleId: input.roleId,
              businessId: businessId ?? "",
            },
          },
          update: {},
          create: {
            userId: u.id,
            roleId: input.roleId,
            businessId: businessId ?? undefined,
          },
        });
      }

      let staffRecord: { id: string } | null = null;
      if (businessId) {
        staffRecord = await tx.staff.create({
          data: {
            userId: u.id,
            businessId,
            position: input.position || null,
          },
          select: { id: true },
        });

        // Optionally create primary assignment if role / branch / store provided
        if (input.roleId || input.branchId || input.storeId) {
          await tx.staffAssignment.create({
            data: {
              staffId: staffRecord.id,
              businessId,
              level: input.storeId ? "store" : input.branchId ? "branch" : "business",
              branchId: input.branchId,
              storeId: input.storeId,
              roleId: input.roleId,
              isPrimary: true,
            },
          });
        }
      }

      // Invite record for onboarding tracking
      const inviteToken = generateToken();
      const inv = await tx.userInvite.create({
        data: {
          userId: u.id,
          email: input.email,
          phone: input.phone || null,
          businessId,
          branchId: input.branchId || null,
          storeId: input.storeId || null,
          roleId: input.roleId || null,
          invitedById,
          inviteToken,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return [u, staffRecord, inv];
    });

    // Build invite URLs & send email
    let emailSent = false;
    try {
      const { sendEmailWithDefaultConfig } = await import("@/notifications/email/services/smtp-service");
      const { renderTemplate, SYSTEM_TEMPLATES } = await import("@/notifications/email/services/template-service");

      const tpl = SYSTEM_TEMPLATES.find((t) => t.slug === "staff-invitation") || SYSTEM_TEMPLATES[0];
      const business = businessId ? await getBusiness(businessId) : null;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const loginUrl = `${baseUrl}/login`;
      const changePasswordUrl = `${baseUrl}/change-password`;
      const inviteUrl = `${baseUrl}/login?invite=${invite.inviteToken}`;

      const rendered = await renderTemplate(tpl, {
        businessName: business?.name ?? "Enkai Business",
        inviteUrl,
        invitedBy: `${updatedUser.firstName} ${updatedUser.lastName}`,
        loginUrl,
        temporaryPassword: tempPassword,
        email: input.email,
        username: input.username || input.email,
        changePasswordUrl,
      });

      const result = await sendEmailWithDefaultConfig({
        to: input.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      emailSent = result.success;
      if (!result.success) {
        console.error("Failed to send invite email:", result.error);
      }
    } catch (err) {
      console.error("Failed to send invite email:", err);
    }

    // If email fails, still succeed but include a warning message
    const inviteMessage = emailSent
      ? "User invited successfully. Invitation email sent."
      : "User invited but email could not be sent. Share the temporary password manually.";

    // Notifications & logs
    const ip = (await headers()).get("x-forwarded-for") || undefined;
    const ua = (await headers()).get("user-agent") || undefined;

    await Promise.all([
      createNotification({
        userId: invitedById,
        title: "User invited",
        message: `You invited ${input.email}`,
        type: "INFO",
        referenceType: "user",
        referenceId: user.id,
      } as any),
      recordActivity({
        userId: invitedById,
        action: "user.invited",
        resourceType: "user",
        resourceId: user.id,
        metadata: {
          inviteId: invite.id,
          businessId,
          branchId: input.branchId || null,
          storeId: input.storeId || null,
        },
        ipAddress: ip,
        userAgent: ua,
      } as any),
      recordAuditLog({
        userId: invitedById,
        action: "user.invited",
        resourceType: "user",
        resourceId: user.id,
        after: {
          email: input.email,
          businessId,
          branchId: input.branchId || null,
          storeId: input.storeId || null,
        },
        ipAddress: ip,
        userAgent: ua,
      }),
    ]);

    return {
      success: true,
      message: inviteMessage,
      data: { userId: user.id, staffId: staff?.id },
    };
  } catch (error) {
    console.error("createInvitedUserWithStaff error", error);
    return { success: false, message: "Failed to invite user" };
  }
}
