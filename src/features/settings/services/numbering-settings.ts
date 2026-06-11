import "server-only";

import type { ActionResponse } from "@/types/relationships";
import type { NumberingSettings } from "../types";
import { NUMBERING_SETTING_KEYS } from "../constants";
import { getSetting, setSetting } from "./setting-service";

export async function getNumberingSettings(
  businessId: string,
): Promise<NumberingSettings> {
  const entries = await Promise.all(
    Object.entries(NUMBERING_SETTING_KEYS).map(async ([key, settingKey]) => {
      const setting = await getSetting(settingKey, { businessId });
      return [key, setting?.value] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, v]) => v !== undefined)) as NumberingSettings;
}

export async function updateNumberingSettings(
  businessId: string,
  data: Partial<NumberingSettings>,
): Promise<ActionResponse> {
  try {
    await Promise.all(
      Object.entries(data).map(([key, value]) => {
        if (value !== undefined) {
          const settingKey = NUMBERING_SETTING_KEYS[key as keyof typeof NUMBERING_SETTING_KEYS];
          if (settingKey) return setSetting(settingKey, value, { businessId });
        }
      }),
    );
    return { success: true, message: "Numbering settings updated" };
  } catch (error) {
    console.error("Update numbering settings error:", error);
    return { success: false, message: "Failed to update numbering settings" };
  }
}
