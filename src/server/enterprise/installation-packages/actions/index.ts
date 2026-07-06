"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  calculatePackagePrice,
  assignPackageToTicket,
  addServiceToTicket,
} from "../services/package-service";
import {
  createPackageSchema,
  updatePackageSchema,
  assignPackageTicketSchema,
  addServiceToTicketSchema,
  calculatePriceSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function getPackagesAction(industry?: string, businessModeId?: string) {
  await requireAuth();
  return getPackages(industry, businessModeId);
}

export async function getPackageAction(id: string) {
  await requireAuth();
  return getPackage(id);
}

export async function createPackageAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    industries: formData.get("industries") ? JSON.parse(formData.get("industries") as string) : [],
    supportedModes: formData.get("supportedModes") ? JSON.parse(formData.get("supportedModes") as string) : [],
    minBranches: formData.get("minBranches") || undefined,
    maxBranches: formData.get("maxBranches") || undefined,
    minQRCodes: formData.get("minQRCodes") || undefined,
    maxQRCodes: formData.get("maxQRCodes") || undefined,
    trainingHours: formData.get("trainingHours") || undefined,
    installationHours: formData.get("installationHours") || undefined,
    brandingIncluded: formData.get("brandingIncluded") === "true",
    printerIncluded: formData.get("printerIncluded") === "true",
    marketingKitIncluded: formData.get("marketingKitIncluded") === "true",
    verificationIncluded: formData.get("verificationIncluded") === "true",
    supportPeriodDays: formData.get("supportPeriodDays") || undefined,
    baseFee: formData.get("baseFee") || undefined,
    pricePerBranch: formData.get("pricePerBranch") || undefined,
    pricePerQRCode: formData.get("pricePerQRCode") || undefined,
    pricePerTrainingHour: formData.get("pricePerTrainingHour") || undefined,
    brandingFee: formData.get("brandingFee") || undefined,
    printerFee: formData.get("printerFee") || undefined,
    pricingFormula: formData.get("pricingFormula") || undefined,
    price: formData.get("price") || undefined,
    currency: formData.get("currency") || "TZS",
  };

  const parsed = createPackageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const pkg = await createPackage(parsed.data);
    revalidatePath("/enterprise/packages");
    return { success: true, message: "Package created", data: { id: pkg.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create package" };
  }
}

export async function updatePackageAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const raw: Record<string, unknown> = {};
  for (const key of ["name", "description", "pricingFormula", "currency"]) {
    const val = formData.get(key);
    if (val) raw[key] = val;
  }
  for (const key of ["industries", "supportedModes"]) {
    const val = formData.get(key);
    if (val) raw[key] = JSON.parse(val as string);
  }
  for (const key of [
    "minBranches", "maxBranches", "minQRCodes", "maxQRCodes",
    "trainingHours", "installationHours", "supportPeriodDays",
    "baseFee", "pricePerBranch", "pricePerQRCode", "pricePerTrainingHour",
    "brandingFee", "printerFee", "price",
  ]) {
    const val = formData.get(key);
    if (val) raw[key] = Number(val);
  }
  for (const key of ["brandingIncluded", "printerIncluded", "marketingKitIncluded", "verificationIncluded"]) {
    const val = formData.get(key);
    if (val !== null) raw[key] = val === "true";
  }

  const parsed = updatePackageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updatePackage(id, parsed.data);
    revalidatePath("/enterprise/packages");
    return { success: true, message: "Package updated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update package" };
  }
}

export async function deletePackageAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await deletePackage(id);
  if (result.success) revalidatePath("/enterprise/packages");
  return result;
}

export async function togglePackageStatusAction(id: string): Promise<ActionResponse> {
  await requireAuth();
  const result = await togglePackageStatus(id);
  if (result.success) revalidatePath("/enterprise/packages");
  return result;
}

export async function assignPackageToTicketAction(
  ticketId: string,
  packageId: string,
  data: Record<string, unknown>,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = assignPackageTicketSchema.safeParse({ ticketId, packageId, ...data });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await assignPackageToTicket(ticketId, packageId, parsed.data);
  if (result.success) revalidatePath(`/installations/${ticketId}`);
  return result;
}

export async function calculatePricePreviewAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = calculatePriceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await calculatePackagePrice(parsed.data.packageId, parsed.data);
  return {
    success: result.success,
    message: result.message ?? (result.data ? "Price calculated" : "Price calculation failed"),
    data: result.data ?? undefined,
  };
}

export async function addServiceToTicketAction(
  ticketId: string,
  type: string,
  notes?: string,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = addServiceToTicketSchema.safeParse({ ticketId, type, notes });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await addServiceToTicket(ticketId, type, notes);
  if (result.success) revalidatePath(`/installations/${ticketId}`);
  return result;
}
