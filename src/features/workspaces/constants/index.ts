export const WORKSPACE_MEMBER_ROLES = ["OWNER", "ADMIN", "MEMBER", "GUEST"] as const;

export const WORKSPACE_MEMBER_ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  GUEST: "Guest",
};

export const WORKSPACE_MEMBER_ROLE_COLORS: Record<string, string> = {
  OWNER: "destructive",
  ADMIN: "warning",
  MEMBER: "default",
  GUEST: "secondary",
} as const;
