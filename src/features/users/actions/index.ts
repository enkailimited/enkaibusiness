"use server";

import type { ActionResponse } from "@/types/relationships";
import type { UpdateProfileInput } from "@/features/users/types";
import { updateProfileSchema } from "@/features/users/schemas";
import * as userService from "@/features/users/services/user-service";
import type { UserProfile } from "@/features/users/types";
import { requireAuth, getSessionUser } from "@/server/auth";
import { hasPermission } from "@/features/rbac";
import { createInvitedUserWithStaff } from "@/features/users/services/admin-user-service";

export async function getProfileAction(userId: string): Promise<
  ActionResponse & { user?: UserProfile }
> {
  try {
    const user = await userService.getProfile(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    return { success: true, message: "Profile fetched successfully", user };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function updateProfileAction(
  userId: string,
  input: UpdateProfileInput,
): Promise<ActionResponse & { user?: UserProfile }> {
  try {
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const user = await userService.updateProfile(userId, parsed.data);
    return { success: true, message: "Profile updated successfully", user };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function getCurrentUserPermissionsAction() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return { success: false, message: "Not authenticated" } as const;
    return {
      success: true,
      roles: sessionUser.roles,
      permissions: sessionUser.permissions,
    } as const;
  } catch {
    return { success: false, message: "Failed to load permissions" } as const;
  }
}

export async function listUsersAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<
  ActionResponse & { users?: UserProfile[]; total?: number }
> {
  try {
    const result = await userService.listUsers(params);
    return {
      success: true,
      message: "Users fetched successfully",
      users: result.users,
      total: result.total,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function inviteUserWithStaffAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const sessionUser = await requireAuth();

  const canCreate = await hasPermission(sessionUser.id, "users.create");
  if (!canCreate) {
    return { success: false, message: "You do not have permission to create users" };
  }

  const firstName = (formData.get("firstName") || "").toString().trim();
  const lastName = (formData.get("lastName") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim();
  const phoneRaw = (formData.get("phone") || "").toString().trim();
  const usernameRaw = (formData.get("username") || "").toString().trim();
  const genderRaw = (formData.get("gender") || "").toString().trim();
  const businessIdRaw = (formData.get("businessId") || "").toString().trim();
  const branchIdRaw = (formData.get("branchId") || "").toString().trim();
  const storeIdRaw = (formData.get("storeId") || "").toString().trim();
  const roleIdRaw = (formData.get("roleId") || "").toString().trim();
  const positionRaw = (formData.get("position") || "").toString().trim();

  if (!firstName || !lastName || !email || !phoneRaw || !usernameRaw || !genderRaw) {
    return { success: false, message: "First name, last name, email, phone, username and gender are required" };
  }

  const result = await createInvitedUserWithStaff(sessionUser.id, {
    firstName,
    lastName,
    email,
    phone: phoneRaw,
    username: usernameRaw,
    gender: genderRaw,
    businessId: businessIdRaw || null,
    branchId: branchIdRaw || null,
    storeId: storeIdRaw || null,
    roleId: roleIdRaw || null,
    position: positionRaw || null,
  });

  return result;
}

export async function activateUserAction(userId: string): Promise<ActionResponse> {
  try {
    const sessionUser = await requireAuth();
    const canManage = await hasPermission(sessionUser.id, "users.update");
    if (!canManage) {
      return { success: false, message: "You do not have permission to manage users" };
    }

    await userService.activateUser(userId);
    return { success: true, message: "User activated successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to activate user",
    };
  }
}

export async function deactivateUserAction(userId: string): Promise<ActionResponse> {
  try {
    const sessionUser = await requireAuth();
    const canManage = await hasPermission(sessionUser.id, "users.update");
    if (!canManage) {
      return { success: false, message: "You do not have permission to manage users" };
    }

    await userService.deactivateUser(userId);
    return { success: true, message: "User deactivated successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to deactivate user",
    };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResponse> {
  try {
    const sessionUser = await requireAuth();
    const canDelete = await hasPermission(sessionUser.id, "users.delete");
    if (!canDelete) {
      return { success: false, message: "You do not have permission to delete users" };
    }

    await userService.deleteUser(userId);
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}
