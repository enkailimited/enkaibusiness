import "server-only";

import { prisma } from "@/server/db";

// Re-export canonical implementations from the feature service to eliminate duplication
export { generateTempPassword, generateToken } from "@/features/users/services/invite-service";

export async function sendStaffInviteEmail(
  email: string,
  tempPassword: string,
  invitedByName: string,
  businessName: string,
): Promise<boolean> {
  const { sendInviteEmail } = await import("@/features/users/services/invite-service");
  return sendInviteEmail(email, tempPassword, invitedByName, businessName, false);
}

export async function createUserInviteRecord(
  data: {
    userId: string;
    email: string;
    phone?: string | null;
    businessId?: string | null;
    branchId?: string | null;
    storeId?: string | null;
    roleId?: string | null;
    invitedById: string;
  },
  tx?: any,
): Promise<{ id: string; inviteToken: string; expiresAt: Date }> {
  const { generateToken } = await import("@/features/users/services/invite-service");
  const inviteToken = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const client = tx || prisma;
  const inv = await client.userInvite.create({
    data: {
      userId: data.userId,
      email: data.email,
      phone: data.phone ?? null,
      businessId: data.businessId ?? null,
      branchId: data.branchId ?? null,
      storeId: data.storeId ?? null,
      roleId: data.roleId ?? null,
      invitedById: data.invitedById,
      inviteToken,
      status: "PENDING",
      expiresAt,
    },
  });

  return { id: inv.id, inviteToken, expiresAt };
}
