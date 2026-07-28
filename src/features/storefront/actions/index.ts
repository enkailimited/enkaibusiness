"use server";

import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { createStorefront, updateStorefront, publishStorefront, archiveStorefront, setActiveTheme } from "../services/storefront-service";

export async function createStorefrontAction(_prev: unknown, formData: FormData) {
  try {
    const user = await requireAuth();
    const businessId = formData.get("businessId") as string;
    const can = await hasPermission(user.id, "storefront.create", businessId);
    if (!can) return { success: false, message: "You do not have permission" };
    const name = formData.get("name") as string;
    if (!businessId || !name) return { success: false, message: "Business and name required" };

    const storefront = await createStorefront({
      businessId,
      name,
      tagline: (formData.get("tagline") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      primaryColor: (formData.get("primaryColor") as string) || undefined,
      secondaryColor: (formData.get("secondaryColor") as string) || undefined,
      accentColor: (formData.get("accentColor") as string) || undefined,
    });

    return { success: true, message: "Storefront created", data: { id: storefront.id, subdomain: storefront.subdomain } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create storefront" };
  }
}

export async function updateStorefrontAction(_prev: unknown, formData: FormData) {
  try {
    const user = await requireAuth();
    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "Storefront ID required" };

    const can = await hasPermission(user.id, "storefront.update");
    if (!can) return { success: false, message: "You do not have permission" };

    const data: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
      if (key !== "id" && val) data[key] = val;
    }

    await updateStorefront(id, data as any);
    return { success: true, message: "Storefront updated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update" };
  }
}

export async function publishStorefrontAction(storefrontId: string) {
  try {
    const user = await requireAuth();
    const can = await hasPermission(user.id, "storefront.update");
    if (!can) return { success: false, message: "You do not have permission" };
    await publishStorefront(storefrontId);
    return { success: true, message: "Storefront published" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to publish" };
  }
}

export async function archiveStorefrontAction(storefrontId: string) {
  try {
    const user = await requireAuth();
    const can = await hasPermission(user.id, "storefront.update");
    if (!can) return { success: false, message: "You do not have permission" };
    await archiveStorefront(storefrontId);
    return { success: true, message: "Storefront archived" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to archive" };
  }
}

export async function setActiveThemeAction(storefrontId: string, themeId: string) {
  try {
    const user = await requireAuth();
    const can = await hasPermission(user.id, "storefront.update");
    if (!can) return { success: false, message: "You do not have permission" };
    await setActiveTheme(storefrontId, themeId);
    return { success: true, message: "Theme activated" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to set theme" };
  }
}
