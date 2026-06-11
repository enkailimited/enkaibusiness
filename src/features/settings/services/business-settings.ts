import "server-only";

import type { ActionResponse } from "@/types/relationships";
import type { BusinessProfileSettings } from "../types";
import { BUSINESS_SETTING_KEYS } from "../constants";
import { getSetting, setSetting } from "./setting-service";

export async function getBusinessProfileSettings(
  businessId: string,
): Promise<BusinessProfileSettings> {
  const entries = await Promise.all(
    Object.entries(BUSINESS_SETTING_KEYS).map(async ([key, settingKey]) => {
      const setting = await getSetting(settingKey, { businessId });
      return [key, setting?.value] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, v]) => v !== undefined)) as BusinessProfileSettings;
}

export async function updateBusinessProfileSettings(
  businessId: string,
  data: Partial<BusinessProfileSettings>,
): Promise<ActionResponse> {
  try {
    await Promise.all(
      Object.entries(data).map(([key, value]) => {
        if (value !== undefined) {
          const settingKey = BUSINESS_SETTING_KEYS[key as keyof typeof BUSINESS_SETTING_KEYS];
          if (settingKey) return setSetting(settingKey, value, { businessId });
        }
      }),
    );
    return { success: true, message: "Business settings updated" };
  } catch (error) {
    console.error("Update business settings error:", error);
    return { success: false, message: "Failed to update business settings" };
  }
}
