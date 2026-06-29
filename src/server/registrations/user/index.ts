import "server-only";

import { prisma } from "@/server/db";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  type RegistrationResponse,
  type UserRegistrationResult,
  createAuthUser,
  generateTempPassword,
  sendStaffInviteEmail,
  createUserInviteRecord,
  success,
  failure,
} from "../shared";
import { RegistrationContext, adapters, type ContextAdapterParams } from "../context";
import { emitUserRegistered, emitUserAssignedToContext } from "../events";

export interface RegisterUserInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  username?: string | null;
  gender?: string | null;
  businessId?: string | null;
  branchId?: string | null;
  storeId?: string | null;
  roleId?: string | null;
  position?: string | null;
  employeeCode?: string | null;
  hireDate?: string | null;
  hierarchyId?: string | null;
  managerId?: string | null;
  workspaceId?: string | null;
  workspaceRole?: string;
  invite?: boolean;
}

export class UserRegistrationEngine {
  static async requirePermission(
    userId: string,
    permission: string,
    businessId?: string | null,
  ): Promise<RegistrationResponse<void> | null> {
    const has = await hasPermission(userId, permission, businessId ?? undefined);
    if (!has) {
      return failure(`You do not have the "${permission}" permission`);
    }
    return null;
  }

  static async register(
    context: RegistrationContext,
    invitedById: string,
    input: RegisterUserInput,
  ): Promise<RegistrationResponse<UserRegistrationResult>> {
    const permissionError = await this.requirePermission(invitedById, "users.invite", input.businessId);
    if (permissionError) return permissionError as unknown as RegistrationResponse<UserRegistrationResult>;

    try {
      const existing = await prisma.user.findFirst({ where: { email: input.email } });
      if (existing) {
        return failure("User with this email already exists");
      }

      const tempPassword = input.password || generateTempPassword();

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
      const adapter = adapters[context];

      await prisma.$transaction(async (tx) => {
        await (tx as typeof prisma).user.update({
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

        const params: ContextAdapterParams = {
          userId,
          businessId: input.businessId,
          branchId: input.branchId,
          storeId: input.storeId,
          roleId: input.roleId,
          position: input.position,
          employeeCode: input.employeeCode,
          hireDate: input.hireDate,
          hierarchyId: input.hierarchyId,
          managerId: input.managerId,
          workspaceId: input.workspaceId,
          workspaceRole: input.workspaceRole,
        };

        await adapter.assign(tx as any, params);

        if (input.invite !== false) {
          await createUserInviteRecord({
            userId,
            email: input.email,
            phone: input.phone ?? null,
            businessId: input.businessId ?? null,
            branchId: input.branchId ?? null,
            storeId: input.storeId ?? null,
            roleId: input.roleId ?? null,
            invitedById,
          }, tx);
        }
      });

      let emailSent = false;
      try {
        const invitedByName = `${input.firstName} ${input.lastName}`.trim() || "Admin";
        emailSent = await sendStaffInviteEmail(
          input.email,
          tempPassword,
          invitedByName,
          "Enkai Business",
        );
      } catch (err) {
        console.error("Failed to send invite email:", err);
      }

      emitUserRegistered(
        input.businessId || "",
        userId,
        invitedById,
        input.email,
        context,
      );

      const inviteMessage = emailSent
        ? "User invited successfully. Invitation email sent."
        : "User invited but email could not be sent. Share the temporary password manually.";

      return success<UserRegistrationResult>(inviteMessage, {
        userId,
        inviteId: null,
      });
    } catch (error) {
      console.error("UserRegistrationEngine.register error", error);
      return failure("Failed to invite user");
    }
  }

  static async assignUserToContext(
    context: RegistrationContext,
    userId: string,
    invitedById: string,
    input: RegisterUserInput,
  ): Promise<RegistrationResponse<UserRegistrationResult>> {
    const permissionError = await this.requirePermission(invitedById, "users.invite", input.businessId);
    if (permissionError) return permissionError as unknown as RegistrationResponse<UserRegistrationResult>;

    try {
      const adapter = adapters[context];

      await prisma.$transaction(async (tx) => {
        await (tx as typeof prisma).user.update({
          where: { id: userId },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone ?? null,
            username: input.username ?? null,
            gender: input.gender ?? null,
          },
        });

        const params: ContextAdapterParams = {
          userId,
          businessId: input.businessId,
          branchId: input.branchId,
          storeId: input.storeId,
          roleId: input.roleId,
          position: input.position,
          employeeCode: input.employeeCode,
          hireDate: input.hireDate,
          hierarchyId: input.hierarchyId,
          managerId: input.managerId,
          workspaceId: input.workspaceId,
          workspaceRole: input.workspaceRole,
        };

        await adapter.assign(tx as any, params);

        if (input.invite !== false) {
          await createUserInviteRecord({
            userId,
            email: input.email,
            phone: input.phone ?? null,
            businessId: input.businessId ?? null,
            branchId: input.branchId ?? null,
            storeId: input.storeId ?? null,
            roleId: input.roleId ?? null,
            invitedById,
          }, tx);
        }
      });

      const tempPassword = generateTempPassword();
      let emailSent = false;
      try {
        const invitedByName = `${input.firstName} ${input.lastName}`.trim() || "Admin";
        emailSent = await sendStaffInviteEmail(
          input.email,
          tempPassword,
          invitedByName,
          "Enkai Business",
        );
      } catch (err) {
        console.error("Failed to send invite email:", err);
      }

      emitUserAssignedToContext(
        input.businessId || "",
        userId,
        invitedById,
        input.email,
        context,
      );

      const inviteMessage = emailSent
        ? "User assigned and invited successfully"
        : "User assigned but email could not be sent.";

      return success<UserRegistrationResult>(inviteMessage, {
        userId,
        inviteId: null,
      });
    } catch (error) {
      console.error("UserRegistrationEngine.assignUserToContext error", error);
      return failure("Failed to assign user to context");
    }
  }
}
