export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isOnboarded: boolean;
  mustChangePassword: boolean;
}

export interface SessionUser extends AuthUser {
  roles: string[];
  permissions: string[];
  currentWorkspaceId: string | null;
  currentBusinessId: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}
