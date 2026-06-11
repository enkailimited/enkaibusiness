// RBAC Module — Role-Based Access Control
// Consolidated from features/rbac, features/roles, features/permissions, and server/services/rbac-service

// Services
export {
  createRole, updateRole, deleteRole, getRole, getRoles,
  createPermission, getPermissions,
  assignPermissionToRole, removePermissionFromRole,
  assignRoleToUser, removeRoleFromUser, getUserRoles,
  hasPermission, hasAnyPermission,
} from "./services/rbac-service";

// Actions
export {
  createRoleAction, updateRoleAction, deleteRoleAction,
  createPermissionAction,
  assignPermissionToRoleAction, removePermissionFromRoleAction,
  assignRoleToUserAction, removeRoleFromUserAction,
} from "./actions";

// Schemas
export {
  createRoleSchema, updateRoleSchema, createPermissionSchema,
  assignRoleSchema, assignPermissionSchema,
} from "./schemas";

// Types
export type { RoleWithPermissions, RoleWithUserCount, RoleScope, RoleInput, PermissionInput } from "./types";

// Constants
export { ROLE_SCOPES, MODULE_NAMES, ROUTE_LABELS } from "./constants";
