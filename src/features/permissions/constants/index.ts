export const PERMISSION_MODULES = [
  "users",
  "roles",
  "permissions",
  "businesses",
  "workspaces",
  "catalog",
  "inventory",
  "sales",
  "purchases",
  "reports",
  "settings",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "assign",
  "manage",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
