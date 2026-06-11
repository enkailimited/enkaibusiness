import type { Workspace, WorkspaceMember, User } from "@/types/models";

export type { Workspace, WorkspaceMember };

export interface WorkspaceWithMembers extends Workspace {
  members: Array<WorkspaceMember & { user: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl"> }>;
  _count?: { businesses: number; members: number };
}

export interface WorkspaceWithCount extends Workspace {
  _count: { members: number; businesses: number };
}

export type WorkspaceMemberRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
