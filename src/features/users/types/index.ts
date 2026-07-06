import type { ActionResponse } from "@/types/relationships";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  username: string | null;
  avatarUrl: string | null;
  nida: string | null;
  address: string;
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles?: { id: string; name: string; slug: string; scope: string }[];
  inviteStatus?: string | null;
  inviteSentAt?: Date | null;
  guarantor?: GuarantorInfo | null;
}

export interface GuarantorInfo {
  id: string;
  fullName: string;
  phone: string;
  relationship: string;
  address: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  nida?: string;
  address?: string;
  guarantor?: {
    fullName: string;
    phone: string;
    relationship: string;
    address: string;
  };
}

export interface ProfileResponse extends ActionResponse {
  user?: UserProfile;
}

export interface UserListResponse extends ActionResponse {
  users?: UserProfile[];
  total?: number;
}
