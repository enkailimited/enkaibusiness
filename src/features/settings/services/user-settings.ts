import "server-only";

import type { ActionResponse } from "@/types/relationships";
import type { UserPreferences } from "../types";
import { USER_SETTING_KEYS } from "../constants";
import { getSetting, setSetting } from "./setting-service";

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const entries = await Promise.all(
    Object.entries(USER_SETTING_KEYS).map(async ([key, settingKey]) => {
      const setting = await getSetting(settingKey, { userId });
      return [key, setting?.value] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, v]) => v !== undefined)) as UserPreferences;
}

export async function updateUserPreferences(
  userId: string,
  data: Partial<UserPreferences>,
): Promise<ActionResponse> {
  try {
    await Promise.all(
      Object.entries(data).map(([key, value]) => {
        if (value !== undefined) {
          const settingKey = USER_SETTING_KEYS[key as keyof typeof USER_SETTING_KEYS];
          if (settingKey) return setSetting(settingKey, value, { userId });
        }
      }),
    );
    return { success: true, message: "User preferences updated" };
  } catch (error) {
    console.error("Update user preferences error:", error);
    return { success: false, message: "Failed to update user preferences" };
  }
}
