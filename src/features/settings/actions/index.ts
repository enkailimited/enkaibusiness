"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import {
  getBusinessProfileSettings,
  updateBusinessProfileSettings,
} from "../services/business-settings";
import {
  getTaxSettings,
  updateTaxSettings,
} from "../services/tax-settings";
import {
  getReceiptSettings,
  updateReceiptSettings,
} from "../services/receipt-settings";
import {
  getNumberingSettings,
  updateNumberingSettings,
} from "../services/numbering-settings";
import {
  getPaymentSettings,
  updatePaymentSettings,
} from "../services/payment-settings";
import {
  getUserPreferences,
  updateUserPreferences,
} from "../services/user-settings";
import {
  getSetting,
  setSetting,
  deleteSetting,
  getSettingsByCategory,
} from "../services/setting-service";
import { createSettingSchema, updateSettingSchema, settingFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import { z } from "zod";
import type { BusinessProfileSettings, TaxSettings, ReceiptSettings, NumberingSettings, PaymentSettings, UserPreferences } from "../types";

export async function getBusinessProfileSettingsAction(
  businessId: string,
): Promise<BusinessProfileSettings> {
  await requireAuth();
  return getBusinessProfileSettings(businessId);
}

export async function updateBusinessSettingsAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Partial<BusinessProfileSettings> = {};
  const fields: (keyof BusinessProfileSettings)[] = [
    "businessName", "businessPhone", "businessEmail", "businessAddress",
    "city", "currency", "timezone", "dateFormat",
  ];
  for (const field of fields) {
    const value = formData.get(field);
    if (value) data[field] = value as string;
  }

  const result = await updateBusinessProfileSettings(businessId, data);
  if (result.success) revalidatePath(`/workspaces/businesses/${businessId}/settings`);
  return result;
}

export async function getTaxSettingsAction(
  businessId: string,
): Promise<TaxSettings> {
  await requireAuth();
  return getTaxSettings(businessId);
}

export async function updateTaxSettingsAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Partial<TaxSettings> = {};
  const taxRate = formData.get("taxRate");
  if (taxRate) data.taxRate = Number(taxRate);
  const taxName = formData.get("taxName");
  if (taxName) data.taxName = taxName as string;
  const tin = formData.get("tin");
  if (tin) data.tin = tin as string;
  const vatRate = formData.get("vatRate");
  if (vatRate) data.vatRate = Number(vatRate);
  data.isVATRegistered = formData.get("isVATRegistered") === "on";

  const result = await updateTaxSettings(businessId, data);
  if (result.success) revalidatePath(`/workspaces/businesses/${businessId}/settings`);
  return result;
}

export async function getReceiptSettingsAction(
  businessId: string,
): Promise<ReceiptSettings> {
  await requireAuth();
  return getReceiptSettings(businessId);
}

export async function updateReceiptSettingsAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Partial<ReceiptSettings> = {};
  const header = formData.get("header");
  if (header) data.header = header as string;
  const footer = formData.get("footer");
  if (footer) data.footer = footer as string;
  const paperSize = formData.get("paperSize");
  if (paperSize) data.paperSize = paperSize as string;
  data.showLogo = formData.get("showLogo") === "on";
  data.showTax = formData.get("showTax") === "on";
  data.showDiscount = formData.get("showDiscount") === "on";
  data.showCustomerInfo = formData.get("showCustomerInfo") === "on";

  const result = await updateReceiptSettings(businessId, data);
  if (result.success) revalidatePath(`/workspaces/businesses/${businessId}/settings`);
  return result;
}

export async function getNumberingSettingsAction(
  businessId: string,
): Promise<NumberingSettings> {
  await requireAuth();
  return getNumberingSettings(businessId);
}

export async function updateNumberingSettingsAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Partial<NumberingSettings> = {};
  const prefixFields: (keyof NumberingSettings)[] = [
    "invoicePrefix", "purchasePrefix", "receiptPrefix",
    "quotationPrefix", "creditNotePrefix",
  ];
  const numberFields: (keyof NumberingSettings)[] = [
    "invoiceLastNumber", "purchaseLastNumber", "receiptLastNumber",
    "quotationLastNumber", "creditNoteLastNumber",
  ];

  for (const field of prefixFields) {
    const value = formData.get(field);
    if (value) data[field] = value as string;
  }
  for (const field of numberFields) {
    const value = formData.get(field);
    if (value) data[field] = Number(value);
  }

  const result = await updateNumberingSettings(businessId, data);
  if (result.success) revalidatePath(`/workspaces/businesses/${businessId}/settings`);
  return result;
}

export async function getPaymentSettingsAction(
  businessId: string,
): Promise<PaymentSettings> {
  await requireAuth();
  return getPaymentSettings(businessId);
}

export async function updatePaymentSettingsAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Partial<PaymentSettings> = {};
  const defaultPaymentMethod = formData.get("defaultPaymentMethod");
  if (defaultPaymentMethod) data.defaultPaymentMethod = defaultPaymentMethod as string;
  const defaultPaymentTerms = formData.get("defaultPaymentTerms");
  if (defaultPaymentTerms) data.defaultPaymentTerms = defaultPaymentTerms as string;
  const paymentDueDays = formData.get("paymentDueDays");
  if (paymentDueDays) data.paymentDueDays = Number(paymentDueDays);

  const result = await updatePaymentSettings(businessId, data);
  if (result.success) revalidatePath(`/workspaces/businesses/${businessId}/settings`);
  return result;
}

export async function getUserPreferencesAction(
  userId: string,
): Promise<UserPreferences> {
  await requireAuth();
  return getUserPreferences(userId);
}

export async function updateUserPreferencesAction(
  userId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const data: Partial<UserPreferences> = {};
  const language = formData.get("language");
  if (language) data.language = language as string;
  const theme = formData.get("theme");
  if (theme) data.theme = theme as UserPreferences["theme"];
  const timezone = formData.get("timezone");
  if (timezone) data.timezone = timezone as string;
  data.notifications = formData.get("notifications") === "on";
  data.emailNotifications = formData.get("emailNotifications") === "on";
  data.smsNotifications = formData.get("smsNotifications") === "on";

  const result = await updateUserPreferences(userId, data);
  if (result.success) revalidatePath("/settings");
  return result;
}

export async function getSettingAction(
  key: string,
  scope: { businessId?: string; userId?: string },
) {
  await requireAuth();
  const keyParsed = stringSchema.safeParse(key);
  if (!keyParsed.success) return null;
  return getSetting(key, scope);
}

export async function setSettingAction(
  key: string,
  value: unknown,
  options?: { businessId?: string; userId?: string; description?: string; isPublic?: boolean },
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createSettingSchema.partial().safeParse({
    key,
    value,
    ...options,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return setSetting(key, value as string | number | boolean | Record<string, unknown>, options);
}

const uuidSchema = z.string().uuid("Invalid ID");
const stringSchema = z.string().min(1, "Required").max(500);

const workspaceNameSchema = z.string().min(1, "Name is required").max(200);
const workspaceDescSchema = z.string().max(1000);

export async function deleteSettingAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: "Invalid setting ID" };
  return deleteSetting(id);
}

export async function getSettingsByCategoryAction(
  businessId?: string,
  userId?: string,
  category?: string,
) {
  await requireAuth();
  return getSettingsByCategory(businessId, userId, category);
}

export async function getWorkspaceSettingsAction() {
  const user = await requireAuth();
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });
  if (!membership) return null;
  return { id: membership.workspace.id, name: membership.workspace.name, description: membership.workspace.description ?? "" };
}

export async function saveWorkspaceSettingsAction(id: string, name: string, description: string) {
  await requireAuth();
  const idParsed = uuidSchema.safeParse(id);
  const nameParsed = workspaceNameSchema.safeParse(name);
  const descParsed = workspaceDescSchema.safeParse(description);
  if (!idParsed.success) return { success: false, message: "Invalid workspace ID" };
  if (!nameParsed.success) return { success: false, message: nameParsed.error.errors[0].message };
  if (!descParsed.success) return { success: false, message: descParsed.error.errors[0].message };
  await prisma.workspace.update({ where: { id }, data: { name, description } });
  return { success: true };
}
