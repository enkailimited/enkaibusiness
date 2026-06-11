import type { ActionResponse } from "@/types/relationships";

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isOnboarded: boolean;
}

export interface SessionUser extends AuthUser {
  roles: string[];
  permissions: string[];
  currentWorkspaceId: string | null;
  currentBusinessId: string | null;
}

export interface AuthResponse extends ActionResponse {
  user?: AuthUser;
}
