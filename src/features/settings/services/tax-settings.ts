import "server-only";

import type { ActionResponse } from "@/types/relationships";
import type { TaxSettings } from "../types";
import { TAX_SETTING_KEYS } from "../constants";
import { getSetting, setSetting } from "./setting-service";

export async function getTaxSettings(
  businessId: string,
): Promise<TaxSettings> {
  const entries = await Promise.all(
    Object.entries(TAX_SETTING_KEYS).map(async ([key, settingKey]) => {
      const setting = await getSetting(settingKey, { businessId });
      return [key, setting?.value] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, v]) => v !== undefined)) as TaxSettings;
}

export async function updateTaxSettings(
  businessId: string,
  data: Partial<TaxSettings>,
): Promise<ActionResponse> {
  try {
    await Promise.all(
      Object.entries(data).map(([key, value]) => {
        if (value !== undefined) {
          const settingKey = TAX_SETTING_KEYS[key as keyof typeof TAX_SETTING_KEYS];
          if (settingKey) return setSetting(settingKey, value, { businessId });
        }
      }),
    );
    return { success: true, message: "Tax settings updated" };
  } catch (error) {
    console.error("Update tax settings error:", error);
    return { success: false, message: "Failed to update tax settings" };
  }
}
