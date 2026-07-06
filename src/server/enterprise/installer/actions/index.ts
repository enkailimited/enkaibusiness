"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getInstallers,
  getInstaller,
  getInstallerByUserId,
  createInstaller,
  updateInstaller,
  updateInstallerStatus,
  updateGPS,
  assignToTicket,
  getInstallerSchedule,
  getNearestInstallers,
  updateTravelStatus,
  getInstallerPerformance,
  addChecklistItem,
  completeChecklistItem,
  getChecklist,
  uploadPhoto,
} from "../services/installer-service";
import { getRoutePlan, updateArrival, updateDeparture } from "../services/installed-service";
import {
  createInstallerSchema,
  updateInstallerSchema,
  updateInstallerStatusSchema,
  updateGPSSchema,
  assignInstallerSchema,
  nearestInstallerSchema,
  updateTravelStatusSchema,
  addChecklistItemSchema,
  completeChecklistItemSchema,
  uploadPhotoSchema,
  getScheduleSchema,
  getPerformanceSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function getInstallersAction(filters?: { status?: string; region?: string; city?: string }) {
  await requireAuth();
  return getInstallers(filters as any);
}

export async function getInstallerAction(id: string) {
  await requireAuth();
  return getInstaller(id);
}

export async function getInstallerByUserIdAction(userId: string) {
  await requireAuth();
  return getInstallerByUserId(userId);
}

export async function createInstallerAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const raw: Record<string, unknown> = {
    userId: formData.get("userId"),
    employeeCode: formData.get("employeeCode") || undefined,
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    photo: formData.get("photo") || undefined,
    region: formData.get("region") || undefined,
    city: formData.get("city") || undefined,
    specialization: formData.get("specialization") || undefined,
    maxAssignments: formData.get("maxAssignments") || 5,
  };

  const parsed = createInstallerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await createInstaller(parsed.data.userId, parsed.data);
    revalidatePath("/enterprise/installers");
    return { success: true, message: "Installer created", data: { id: result.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create installer" };
  }
}

export async function updateInstallerAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const raw: Record<string, unknown> = {};
  for (const key of ["firstName", "lastName", "email", "phone", "photo", "region", "city", "specialization", "employeeCode"]) {
    const val = formData.get(key);
    if (val) raw[key] = val;
  }
  const max = formData.get("maxAssignments");
  if (max) raw.maxAssignments = Number(max);
  const meta = formData.get("metadata");
  if (meta) raw.metadata = JSON.parse(meta as string);

  const parsed = updateInstallerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateInstaller(id, parsed.data);
    revalidatePath("/enterprise/installers");
    return { success: true, message: "Installer updated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update installer" };
  }
}

export async function updateInstallerStatusAction(
  id: string,
  data: Record<string, unknown>,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateInstallerStatusSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateInstallerStatus(
      id,
      parsed.data.status as any,
      parsed.data.gpsLat !== undefined && parsed.data.gpsLng !== undefined
        ? { lat: parsed.data.gpsLat, lng: parsed.data.gpsLng }
        : undefined,
    );
    revalidatePath("/enterprise/installers");
    return { success: true, message: "Installer status updated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update status" };
  }
}

export async function updateGPSAction(installerId: string, data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateGPSSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateGPS(installerId, parsed.data.lat, parsed.data.lng);
    return { success: true, message: "GPS position updated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update GPS" };
  }
}

export async function assignInstallerToTicketAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = assignInstallerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const ticket = await assignToTicket(
      parsed.data.installerId,
      parsed.data.ticketId,
      parsed.data.assignedBy,
      parsed.data.scheduledDate,
    );
    revalidatePath(`/installations/${parsed.data.ticketId}`);
    return { success: true, message: "Installer assigned to ticket", data: { ticketId: ticket.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to assign installer" };
  }
}

export async function getInstallerScheduleAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = getScheduleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const schedule = await getInstallerSchedule(parsed.data.installerId, parsed.data.dateFrom, parsed.data.dateTo);
    return { success: true, message: "Schedule retrieved", data: schedule };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to get schedule" };
  }
}

export async function getNearestInstallersAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = nearestInstallerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const result = await getNearestInstallers(parsed.data.lat, parsed.data.lng, parsed.data.radius);
    return { success: true, message: "Nearest installers found", data: result };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to find nearest installers" };
  }
}

export async function updateTravelStatusAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateTravelStatusSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const gps = parsed.data.gpsLat !== undefined && parsed.data.gpsLng !== undefined
      ? { lat: parsed.data.gpsLat, lng: parsed.data.gpsLng }
      : undefined;
    const logs = await updateTravelStatus(
      parsed.data.installerId,
      parsed.data.ticketId,
      parsed.data.status,
      gps,
      parsed.data.address,
      parsed.data.notes,
    );
    revalidatePath(`/installations/${parsed.data.ticketId}`);
    return { success: true, message: "Travel status updated", data: logs };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update travel status" };
  }
}

export async function getInstallerPerformanceAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = getPerformanceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const result = await getInstallerPerformance(parsed.data.installerId, {
      dateFrom: parsed.data.dateFrom,
      dateTo: parsed.data.dateTo,
    });
    return { success: true, message: "Performance data retrieved", data: result };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to get performance" };
  }
}

export async function addChecklistItemAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const raw: Record<string, unknown> = {
    ticketId: formData.get("ticketId"),
    name: formData.get("name"),
    isRequired: formData.get("isRequired") !== "false",
    sortOrder: formData.get("sortOrder") || 0,
  };

  const parsed = addChecklistItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const item = await addChecklistItem(parsed.data.ticketId, parsed.data.name, parsed.data.isRequired, parsed.data.sortOrder);
    revalidatePath(`/installations/${parsed.data.ticketId}`);
    return { success: true, message: "Checklist item added", data: { id: item.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to add checklist item" };
  }
}

export async function completeChecklistItemAction(data: Record<string, unknown>): Promise<ActionResponse> {
  await requireAuth();

  const parsed = completeChecklistItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const item = await completeChecklistItem(parsed.data.itemId, parsed.data.photoUrl, parsed.data.notes);
    revalidatePath(`/installations`);
    return { success: true, message: "Checklist item completed", data: { id: item.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to complete checklist item" };
  }
}

export async function getChecklistAction(ticketId: string): Promise<ActionResponse> {
  await requireAuth();

  try {
    const items = await getChecklist(ticketId);
    return { success: true, message: "Checklist retrieved", data: items };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to get checklist" };
  }
}

export async function uploadPhotoAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth() as { id: string };

  const raw: Record<string, unknown> = {
    ticketId: formData.get("ticketId"),
    url: formData.get("url"),
    category: formData.get("category"),
    uploadedBy: user.id,
    caption: formData.get("caption") || undefined,
  };

  const parsed = uploadPhotoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const photo = await uploadPhoto(parsed.data.ticketId, parsed.data.url, parsed.data.category, parsed.data.uploadedBy, parsed.data.caption);
    revalidatePath(`/installations/${parsed.data.ticketId}`);
    return { success: true, message: "Photo uploaded", data: { id: photo.id } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to upload photo" };
  }
}

export async function getRoutePlanAction(installerId: string, date: string): Promise<ActionResponse> {
  await requireAuth();

  try {
    const plan = await getRoutePlan(installerId, date);
    return { success: true, message: "Route plan retrieved", data: plan };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to get route plan" };
  }
}

export async function updateArrivalAction(installerId: string, ticketId: string, gps?: { lat: number; lng: number }): Promise<ActionResponse> {
  await requireAuth();

  try {
    const result = await updateArrival(installerId, ticketId, gps);
    revalidatePath(`/installations/${ticketId}`);
    return { success: true, message: "Arrival recorded", data: result };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to record arrival" };
  }
}

export async function updateDepartureAction(installerId: string, ticketId: string): Promise<ActionResponse> {
  await requireAuth();

  try {
    const result = await updateDeparture(installerId, ticketId);
    revalidatePath(`/installations/${ticketId}`);
    return result;
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to record departure" };
  }
}
