import type { Industry } from "@prisma/client";

export interface CreateStaffUserInput {
  email: string;
  password: string;
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
}

export interface CreateBusinessInput {
  name: string;
  slug: string;
  workspaceId: string;
  createdById: string;
  updatedById?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  currency?: string;
  timezone?: string;
  taxId?: string | null;
  industry: Industry;
  modes: string[];
  planId: string;
  businessSize?: string;
  businessTypeId?: string | null;
  branchId?: string | null;
  storeId?: string | null;
}

export interface StaffRegistrationResult {
  userId: string;
  staffId?: string | null;
  staffAssignmentId?: string | null;
  userRoleId?: string | null;
  inviteId?: string | null;
}

export interface UserRegistrationResult {
  userId: string;
  inviteId?: string | null;
}

export interface BusinessRegistrationResult {
  businessId: string;
  subscriptionId: string;
  walletId?: string | null;
  ownerStaffId?: string;
}
