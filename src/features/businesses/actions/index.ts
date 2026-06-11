"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import {
  createBusiness,
  updateBusiness,
  getBusiness,
  getWorkspaceBusinesses,
  deleteBusiness,
} from "../services/business-service";
import { createBusinessSchema, updateBusinessSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createBusinessAction(
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createBusinessSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    currency: formData.get("currency") || "TZS",
    timezone: formData.get("timezone") || "Africa/Dar_es_Salaam",
    taxId: formData.get("taxId") || undefined,
    industry: formData.get("industry"),
    modes: JSON.parse((formData.get("modes") as string) || "[]"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createBusiness(parsed.data, workspaceId, user.id);

  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }

  return result;
}

export async function updateBusinessAction(
  id: string,
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = updateBusinessSchema.safeParse({
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    currency: formData.get("currency") || undefined,
    timezone: formData.get("timezone") || undefined,
    taxId: formData.get("taxId") || undefined,
    industry: formData.get("industry") || undefined,
    modes: formData.get("modes") ? JSON.parse(formData.get("modes") as string) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateBusiness(id, parsed.data, user.id);

  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }

  return result;
}

export async function getBusinessAction(id: string) {
  await requireAuth();
  return getBusiness(id);
}

export async function getWorkspaceBusinessesAction(workspaceId: string) {
  await requireAuth();
  return getWorkspaceBusinesses(workspaceId);
}

export async function deleteBusinessAction(businessId: string, workspaceId: string) {
  await requireAuth();
  const result = await deleteBusiness(businessId);
  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }
  return result;
}

export async function getBusinessesAction() {
  const user = await requireAuth();

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (!membership) return [];

  const businesses = await prisma.business.findMany({
    where: { workspaceId: membership.workspaceId },
    include: {
      _count: { select: { branches: true, staff: true, customers: true } },
      modes: { select: { industry: true, mode: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(businesses);
}
