"use server";

import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import {
  generateTempPassword as genTempPassword,
  setUserPassword,
  sendInviteEmail as sendReinviteEmail,
  createUserInvite,
} from "@/features/users/services/invite-service";

const ROLE_TO_HIERARCHY: Record<string, string> = {
  "national-sales-manager": "national-sales-manager",
  "national-manager": "national-sales-manager",
  "regional-manager": "region-manager",
  "team-leader": "team-leader",
  freelancer: "freelancer",
};

const HIERARCHY_LEVEL: Record<string, number> = {
  "national-sales-manager": 1,
  "region-manager": 2,
  "team-leader": 3,
  freelancer: 4,
};

const CAN_ADD: Record<number, number[]> = {
  1: [2, 3, 4],
  2: [3, 4],
  3: [4],
  4: [],
};

const SALES_ROLES = Object.keys(ROLE_TO_HIERARCHY);

async function seedHierarchies() {
  const count = await prisma.salesHierarchy.count();
  if (count > 0) return;
  const levels: { slug: string; title: string; level: number; description: string }[] = [
    { slug: "national-sales-manager", title: "National Sales Manager", level: 1, description: "Oversees all national sales operations" },
    { slug: "region-manager", title: "Region Manager", level: 2, description: "Manages sales in a specific region" },
    { slug: "team-leader", title: "Team Leader", level: 3, description: "Leads a team of freelance sales agents" },
    { slug: "freelancer", title: "Freelancer", level: 4, description: "Independent sales agent" },
  ];
  for (const l of levels) {
    await prisma.salesHierarchy.upsert({
      where: { slug: l.slug },
      update: {},
      create: l,
    });
  }
}

function generateTempPassword(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `ENK-${part()}-${part()}`;
}

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

async function sendInviteEmail(
  email: string,
  tempPassword: string,
  firstName: string,
  lastName: string,
  invitedByName: string,
  isReinvite: boolean,
) {
  try {
    const { sendEmailWithDefaultConfig } = await import("@/notifications/email/services/smtp-service");
    const { renderTemplate, SYSTEM_TEMPLATES } = await import("@/notifications/email/services/template-service");

    const tpl = SYSTEM_TEMPLATES.find((t) => t.slug === "staff-invitation") || SYSTEM_TEMPLATES[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const rendered = await renderTemplate(tpl, {
      businessName: "Enkai Business",
      inviteUrl: `${baseUrl}/login?invite=pending`,
      invitedBy: invitedByName,
      loginUrl: `${baseUrl}/login`,
      temporaryPassword: tempPassword,
      email,
      username: email,
      changePasswordUrl: `${baseUrl}/change-password`,
    });

    const result = await sendEmailWithDefaultConfig({
      to: email,
      subject: isReinvite ? "Re-invitation to Enkai Business" : "Invitation to Enkai Business",
      html: rendered.html,
      text: rendered.text,
    });

    return result.success;
  } catch (err) {
    console.error("Failed to send invite email:", err);
    return false;
  }
}

async function ensureManagerProfile(userId: string) {
  let profile = await prisma.salesProfile.findUnique({
    where: { userId },
    include: { hierarchy: true },
  });

  if (!profile) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId, businessId: null },
      include: { role: true },
    });
    const salesRole = userRoles.find((ur) => SALES_ROLES.includes(ur.role.slug));
    if (salesRole) {
      const hierarchySlug = ROLE_TO_HIERARCHY[salesRole.role.slug];
      const hierarchy = hierarchySlug
        ? await prisma.salesHierarchy.findUnique({ where: { slug: hierarchySlug } })
        : null;
      if (hierarchy) {
        profile = await prisma.salesProfile.create({
          data: { userId, hierarchyId: hierarchy.id, status: "ACTIVE" },
          include: { hierarchy: true },
        });
      }
    }
  }

  return profile;
}

export async function inviteSalesTeamMemberAction(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();

    const firstName = (formData.get("firstName") || "").toString().trim();
    const lastName = (formData.get("lastName") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const username = (formData.get("username") || "").toString().trim();
    const gender = (formData.get("gender") || "").toString().trim();
    const hierarchyId = (formData.get("hierarchyId") || "").toString().trim();

    if (!firstName || !lastName || !email || !phone || !username || !gender) {
      return { success: false, message: "All personal fields are required" };
    }

    if (!hierarchyId) {
      return { success: false, message: "Sales role is required" };
    }

    const managerProfile = await ensureManagerProfile(authUser.id);
    if (!managerProfile) {
      return { success: false, message: "You don't have a sales profile" };
    }

    const managerLevel = HIERARCHY_LEVEL[managerProfile.hierarchy?.slug ?? ""];
    if (!managerLevel || managerLevel === 4) {
      return { success: false, message: "You are not authorized to add team members" };
    }

    let targetHierarchy = await prisma.salesHierarchy.findUnique({
      where: { id: hierarchyId },
    });

    if (!targetHierarchy) {
      await seedHierarchies();
      targetHierarchy = await prisma.salesHierarchy.findUnique({
        where: { id: hierarchyId },
      });
    }

    if (!targetHierarchy) {
      return { success: false, message: "Invalid hierarchy level" };
    }

    const targetLevel = HIERARCHY_LEVEL[targetHierarchy.slug];
    const addableLevels = CAN_ADD[managerLevel] || [];
    if (!targetLevel || !addableLevels.includes(targetLevel)) {
      return { success: false, message: "You cannot add this hierarchy level" };
    }

    const existingUser = await prisma.user.findFirst({ where: { email } });

    if (existingUser) {
      const existingProfile = await prisma.salesProfile.findUnique({
        where: { userId: existingUser.id },
      });

      if (existingProfile) {
        return { success: false, message: "User already has a sales profile. You can manage them from the team list below." };
      }

      const tempPassword = generateTempPassword();

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          username: username || null,
          gender: gender || null,
        },
      });

      await prisma.salesProfile.create({
        data: {
          userId: existingUser.id,
          hierarchyId,
          managerId: managerProfile.id,
          status: "ACTIVE",
        },
      });

      const hdrs = await headers();
      const invitedByName = `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "Admin";

      const emailSent = await sendInviteEmail(email, tempPassword, firstName, lastName, invitedByName, false);

      if (!emailSent) {
        await prisma.userInvite.create({
          data: {
            userId: existingUser.id,
            email,
            invitedById: authUser.id,
            inviteToken: generateToken(),
            status: "PENDING",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      revalidatePath("/platform/sales-team/team");
      return {
        success: true,
        message: emailSent
          ? `Invitation sent to ${email}`
          : `Team member added. Temp password: ${tempPassword}`,
      };
    }

    const tempPassword = generateTempPassword();

    const hdrs = await headers();
    const signUpRes = await auth.api.signUpEmail({
      body: {
        email,
        password: tempPassword,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        gender: gender || null,
      },
      headers: hdrs,
    } as any);

    if (!signUpRes || (signUpRes as any).error) {
      return { success: false, message: "Failed to create user account" };
    }

    const newUser = await prisma.user.findUnique({ where: { email } });
    if (!newUser) {
      return { success: false, message: "User could not be loaded after creation" };
    }

    await prisma.user.update({
      where: { id: newUser.id },
      data: {
        phone: phone || null,
        username: username || null,
      },
    });

    await prisma.salesProfile.create({
      data: {
        userId: newUser.id,
        hierarchyId,
        managerId: managerProfile.id,
        status: "ACTIVE",
      },
    });

    const invitedByName = `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "Admin";
    const emailSent = await sendInviteEmail(email, tempPassword, firstName, lastName, invitedByName, false);

    if (!emailSent) {
      await prisma.userInvite.create({
        data: {
          userId: newUser.id,
          email,
          phone: phone || null,
          invitedById: authUser.id,
          inviteToken: generateToken(),
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    revalidatePath("/platform/sales-team/team");
    return {
      success: true,
      message: emailSent
        ? `Invitation sent to ${email}`
        : `User created. Share temp password: ${tempPassword}`,
    };
  } catch (error) {
    console.error("Invite team member error:", error);
    return { success: false, message: "Failed to invite team member" };
  }
}

export async function reinviteTeamMemberAction(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();
    const userId = (formData.get("userId") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const targetEmail = email || user.email;
    const targetPhone = phone || user.phone || null;

    if (email || phone) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        },
      });
    }

    const tempPassword = genTempPassword();
    await setUserPassword(user.id, tempPassword);
    await createUserInvite(userId, targetEmail, targetPhone || null, authUser.id);

    const invitedByName = `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "Admin";
    const emailSent = await sendReinviteEmail(targetEmail, tempPassword, invitedByName, "Enkai Business", true);

    revalidatePath("/platform/sales-team/team");
    return {
      success: true,
      message: emailSent
        ? `Re-invitation sent to ${targetEmail}`
        : `Password reset. New temp password: ${tempPassword}`,
    };
  } catch (error) {
    console.error("Re-invite error:", error);
    return { success: false, message: "Failed to re-invite user" };
  }
}

export async function updateTeamMemberAction(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();
    const userId = (formData.get("userId") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const firstName = (formData.get("firstName") || "").toString().trim();
    const lastName = (formData.get("lastName") || "").toString().trim();
    const username = (formData.get("username") || "").toString().trim();

    if (!userId || !email) {
      return { success: false, message: "User ID and email are required" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        email,
        ...(phone ? { phone } : {}),
        ...(username ? { username } : {}),
      },
    });

    revalidatePath("/platform/sales-team/team");
    return { success: true, message: "User info updated successfully" };
  } catch (error) {
    console.error("Update member error:", error);
    return { success: false, message: "Failed to update user info" };
  }
}
