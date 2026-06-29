import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { createNotification } from "@/features/notifications/services/notification-service";
import { recordActivity } from "@/features/activities/services/activity-service";
import { recordAuditLog } from "@/features/audit-logs/services/audit-service";
import {
  type CreateStaffUserInput,
  type StaffRegistrationResult,
  type RegistrationResponse,
  createAuthUser,
  generateTempPassword,
  sendStaffInviteEmail,
  createUserInviteRecord,
  success,
  failure,
} from "../shared";
import { CommerceResolver, type BusinessTypeResolver } from "../resolvers";

export class StaffRegistrationEngine {
  static async register(
    invitedById: string,
    input: CreateStaffUserInput,
    resolver?: BusinessTypeResolver,
  ): Promise<RegistrationResponse<StaffRegistrationResult>> {
    const effectiveResolver = resolver || new CommerceResolver();
    try {
      const existing = await prisma.user.findFirst({ where: { email: input.email } });
      if (existing) {
        return failure("User with this email already exists");
      }

      if (input.username) {
        const existingUsername = await prisma.user.findFirst({ where: { username: input.username } });
        if (existingUsername) {
          return failure("Username is already taken");
        }
      }

      if (input.phone) {
        const existingPhone = await prisma.user.findFirst({ where: { phone: input.phone } });
        if (existingPhone) {
          return failure("Phone number is already in use");
        }
      }

      const tempPassword = generateTempPassword();

      const created = await createAuthUser({
        email: input.email,
        password: tempPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        gender: input.gender,
      });

      if (!created) {
        return failure("Failed to create auth user");
      }

      const { userId } = created;
      const businessId = input.businessId ?? null;

      const [inv, staffRecord] = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone ?? null,
            username: input.username ?? null,
            gender: input.gender ?? null,
            isOnboarded: false,
          },
        });

        if (input.roleId) {
          const existingRole = await tx.userRole.findFirst({
            where: { userId, roleId: input.roleId, businessId },
          });
          if (!existingRole) {
            await tx.userRole.create({
              data: { userId, roleId: input.roleId, businessId },
            });
          }
        }

        let staffRecord: { id: string } | null = null;
        if (businessId) {
          staffRecord = await tx.staff.create({
            data: {
              userId,
              businessId,
              position: input.position ?? null,
              employeeCode: input.employeeCode ?? null,
              hireDate: input.hireDate ? new Date(input.hireDate) : null,
            },
            select: { id: true },
          });

          if (input.roleId || input.branchId || input.storeId) {
            const level = await effectiveResolver.resolveLevel({
              branchId: input.branchId ?? null,
              storeId: input.storeId ?? null,
            });
            await tx.staffAssignment.create({
              data: {
                staffId: staffRecord.id,
                businessId,
                level,
                branchId: input.branchId ?? null,
                storeId: input.storeId ?? null,
                roleId: input.roleId ?? null,
                isPrimary: true,
              },
            });
          }
        }

        const inv = await createUserInviteRecord({
          userId,
          email: input.email,
          phone: input.phone ?? null,
          businessId,
          branchId: input.branchId ?? null,
          storeId: input.storeId ?? null,
          roleId: input.roleId ?? null,
          invitedById,
        }, tx);

        return [inv, staffRecord] as const;
      });

      let emailSent = false;
      try {
        const business = businessId
          ? await prisma.business.findUnique({ where: { id: businessId }, select: { name: true } })
          : null;
        const invitedByName = `${input.firstName} ${input.lastName}`.trim() || "Admin";
        emailSent = await sendStaffInviteEmail(
          input.email,
          tempPassword,
          invitedByName,
          business?.name ?? "Enkai Business",
        );
      } catch (err) {
        console.error("Failed to send invite email:", err);
      }

      const ip = (await headers()).get("x-forwarded-for") || undefined;
      const ua = (await headers()).get("user-agent") || undefined;

      await Promise.all([
        createNotification({
          userId: invitedById,
          title: "User invited",
          message: `You invited ${input.email}`,
          type: "INFO",
          referenceType: "user",
          referenceId: userId,
        } as any),
        recordActivity({
          userId: invitedById,
          action: "user.invited",
          resourceType: "user",
          resourceId: userId,
          metadata: {
            inviteId: inv.id,
            businessId,
            branchId: input.branchId ?? null,
            storeId: input.storeId ?? null,
          },
          ipAddress: ip,
          userAgent: ua,
        } as any),
        recordAuditLog({
          userId: invitedById,
          action: "user.invited",
          resourceType: "user",
          resourceId: userId,
          after: {
            email: input.email,
            businessId,
            branchId: input.branchId ?? null,
            storeId: input.storeId ?? null,
          },
          ipAddress: ip,
          userAgent: ua,
        }),
      ]);

      const inviteMessage = emailSent
        ? "User invited successfully. Invitation email sent."
        : "User invited but email could not be sent. Share the temporary password manually.";

      return success<StaffRegistrationResult>(inviteMessage, {
        userId,
        staffId: staffRecord?.id ?? null,
        inviteId: inv.id,
      });
    } catch (error) {
      console.error("StaffRegistrationEngine.register error", error);
      return failure("Failed to invite user");
    }
  }
}
