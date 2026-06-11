import type { AuditLog, User } from "@/types/models";

export interface AuditLogWithUser extends AuditLog {
  user: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl">;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  fromDate?: string;
  toDate?: string;
}
