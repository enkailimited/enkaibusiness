import type { Business, BusinessMode, Branch, Store, User, Workspace, WorkspaceMember } from "./models";

export interface BusinessWithModes extends Business {
  modes: BusinessMode[];
}

export interface BranchWithStores extends Branch {
  stores: Store[];
}

export interface UserWithRoles extends User {
  userRoles?: Array<{
    role: {
      id: string;
      name: string;
      slug: string;
      scope: string;
    };
    businessId: string | null;
  }>;
}

export interface WorkspaceWithMembers extends Workspace {
  members: Array<WorkspaceMember & { user: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl"> }>;
  businesses?: Business[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: T;
}
