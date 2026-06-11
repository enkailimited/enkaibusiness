import type { SalesHierarchy, SalesProfile, User } from "@/types/models";
import type { SalesProfileStatus } from "@/types/enums";

export interface HierarchyWithCount extends SalesHierarchy {
  _count?: { profiles: number };
}

export interface ProfileWithUser extends SalesProfile {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "phone" | "avatarUrl" | "isActive">;
  hierarchy?: SalesHierarchy | null;
}

export interface ProfileWithTree extends ProfileWithUser {
  manager?: {
    id: string;
    user: Pick<User, "id" | "firstName" | "lastName">;
  } | null;
  subordinates?: ProfileWithUser[];
  _count?: { subordinates: number; leads: number };
  children?: ProfileWithTree[];
}

export interface ProfileWithCounts extends ProfileWithUser {
  manager?: {
    id: string;
    user: Pick<User, "id" | "firstName" | "lastName">;
  } | null;
  _count?: { subordinates: number; leads: number };
}

export interface FreelancerProfile extends ProfileWithUser {
  _count?: { leads: number };
}

export interface ProfileFilter {
  status?: SalesProfileStatus;
  hierarchyId?: string;
  managerId?: string;
  search?: string;
}
