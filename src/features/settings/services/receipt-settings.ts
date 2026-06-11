import "server-only";

import type { ActionResponse } from "@/types/relationships";
import type { ReceiptSettings } from "../types";
import { RECEIPT_SETTING_KEYS } from "../constants";
import { getSetting, setSetting } from "./setting-service";

export async function getReceiptSettings(
  businessId: string,
): Promise<ReceiptSettings> {
  const entries = await Promise.all(
    Object.entries(RECEIPT_SETTING_KEYS).map(async ([key, settingKey]) => {
      const setting = await getSetting(settingKey, { businessId });
      return [key, setting?.value] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, v]) => v !== undefined)) as ReceiptSettings;
}

export async function updateReceiptSettings(
  businessId: string,
  data: Partial<ReceiptSettings>,
): Promise<ActionResponse> {
  try {
    await Promise.all(
      Object.entries(data).map(([key, value]) => {
        if (value !== undefined) {
          const settingKey = RECEIPT_SETTING_KEYS[key as keyof typeof RECEIPT_SETTING_KEYS];
          if (settingKey) return setSetting(settingKey, value, { businessId });
        }
      }),
    );
    return { success: true, message: "Receipt settings updated" };
  } catch (error) {
    console.error("Update receipt settings error:", error);
    return { success: false, message: "Failed to update receipt settings" };
  }
}
