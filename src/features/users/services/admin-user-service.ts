import "server-only";

import { StaffRegistrationEngine } from "@/server/registrations";
import type { ActionResponse } from "@/types/relationships";

export interface CreateInvitedUserInput {
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
  employeeCode?: string | null;
  hireDate?: string | null;
}

export async function createInvitedUserWithStaff(
  invitedById: string,
  input: CreateInvitedUserInput,
): Promise<ActionResponse & { data?: { userId: string; staffId?: string } }> {
  const result = await StaffRegistrationEngine.register(invitedById, {
    email: input.email,
    password: "", // will be generated inside engine
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    username: input.username,
    gender: input.gender,
    businessId: input.businessId ?? null,
    branchId: input.branchId ?? null,
    storeId: input.storeId ?? null,
    roleId: input.roleId ?? null,
    position: input.position ?? null,
    employeeCode: input.employeeCode ?? null,
    hireDate: input.hireDate ?? null,
  });

  return {
    success: result.success,
    message: result.message,
    data: result.data
      ? { userId: result.data.userId, staffId: result.data.staffId ?? undefined }
      : undefined,
  };
}
