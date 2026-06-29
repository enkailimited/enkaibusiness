import "server-only";

import { getSetting, setSetting } from "@/features/settings/services/setting-service";
import { PROCUREMENT_SETTING_KEYS } from "@/features/settings/constants";

export async function isAdvancedProcurement(businessId: string): Promise<boolean> {
  const setting = await getSetting(PROCUREMENT_SETTING_KEYS.advancedProcurement, { businessId });
  return setting?.value === true;
}

export async function setAdvancedProcurement(
  businessId: string,
  enabled: boolean,
): Promise<void> {
  await setSetting(PROCUREMENT_SETTING_KEYS.advancedProcurement, enabled, { businessId });
}
