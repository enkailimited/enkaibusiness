import type { Activity, User } from "@/types/models";

export interface ActivityWithUser extends Activity {
  user: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl">;
}

export interface CreateActivityInput {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityFilter {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  fromDate?: string;
  toDate?: string;
}
