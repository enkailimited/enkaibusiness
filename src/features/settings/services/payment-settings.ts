import "server-only";

import type { ActionResponse } from "@/types/relationships";
import type { PaymentSettings } from "../types";
import { PAYMENT_SETTING_KEYS } from "../constants";
import { getSetting, setSetting } from "./setting-service";

export async function getPaymentSettings(
  businessId: string,
): Promise<PaymentSettings> {
  const entries = await Promise.all(
    Object.entries(PAYMENT_SETTING_KEYS).map(async ([key, settingKey]) => {
      const setting = await getSetting(settingKey, { businessId });
      return [key, setting?.value] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, v]) => v !== undefined)) as PaymentSettings;
}

export async function updatePaymentSettings(
  businessId: string,
  data: Partial<PaymentSettings>,
): Promise<ActionResponse> {
  try {
    await Promise.all(
      Object.entries(data).map(([key, value]) => {
        if (value !== undefined) {
          const settingKey = PAYMENT_SETTING_KEYS[key as keyof typeof PAYMENT_SETTING_KEYS];
          if (settingKey) return setSetting(settingKey, value, { businessId });
        }
      }),
    );
    return { success: true, message: "Payment settings updated" };
  } catch (error) {
    console.error("Update payment settings error:", error);
    return { success: false, message: "Failed to update payment settings" };
  }
}
