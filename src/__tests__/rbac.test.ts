import { describe, it, expect } from "vitest";

// Pure logic tests for RBAC permission checking
describe("RBAC Permission Logic", () => {
  function hasPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    return userPermissions.includes(requiredPermission);
  }

  function hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.some((p) => userPermissions.includes(p));
  }

  function hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.every((p) => userPermissions.includes(p));
  }

  it("should allow access when user has the required permission", () => {
    expect(hasPermission(["sales:read", "inventory:read"], "sales:read")).toBe(true);
  });

  it("should deny access when user lacks the required permission", () => {
    expect(hasPermission(["sales:read"], "inventory:write")).toBe(false);
  });

  it("should allow access with any permission match", () => {
    expect(hasAnyPermission(["sales:read"], ["sales:write", "inventory:read", "sales:read"])).toBe(true);
  });

  it("should deny access with no matching permissions", () => {
    expect(hasAnyPermission(["sales:read"], ["inventory:write", "finance:read"])).toBe(false);
  });

  it("should require all permissions", () => {
    expect(hasAllPermissions(["sales:read", "inventory:write"], ["sales:read", "inventory:write"])).toBe(true);
  });

  it("should deny when any required permission is missing", () => {
    expect(hasAllPermissions(["sales:read"], ["sales:read", "inventory:write"])).toBe(false);
  });
});
