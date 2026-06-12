"use server";

import { getLoginGreetingData, scanBusiness } from "../services/proactive-advisor";

export async function getGreetingDataAction(businessId: string, userId: string) {
  return getLoginGreetingData(businessId, userId);
}

export async function getBusinessScanAction(businessId: string) {
  return scanBusiness(businessId);
}
