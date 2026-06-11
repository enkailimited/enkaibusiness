export type StaffAssignmentLevel = "business" | "branch" | "store";

export interface StaffWithUser {
  id: string;
  userId: string;
  businessId: string;
  employeeCode: string | null;
  position: string | null;
  hireDate: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface StaffAssignmentWithDetails {
  id: string;
  staffId: string;
  level: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  roleId: string | null;
  isPrimary: boolean;
  createdAt: Date;
  branch: { id: string; name: string } | null;
  store: { id: string; name: string } | null;
  role: { id: string; name: string; slug: string } | null;
}

export interface StaffWithAssignments extends StaffWithUser {
  assignments: StaffAssignmentWithDetails[];
}

export interface CreateStaffInput {
  userId: string;
  businessId: string;
  employeeCode?: string;
  position?: string;
  hireDate?: string;
}

export interface UpdateStaffInput {
  employeeCode?: string;
  position?: string;
  hireDate?: string;
  isActive?: boolean;
}

export interface CreateAssignmentInput {
  staffId: string;
  level: StaffAssignmentLevel;
  businessId: string;
  branchId?: string;
  storeId?: string;
  roleId?: string;
  isPrimary?: boolean;
}
