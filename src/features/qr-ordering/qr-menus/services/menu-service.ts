import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateMenuItemSchema, UpdateMenuItemSchema } from "../schemas";
import type { MenuItemWithCatalog } from "../types";

export async function createMenuItem(
  data: CreateMenuItemSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existing = await prisma.qRMenuItem.findUnique({
      where: {
        qrCodeId_catalogItemId: {
          qrCodeId: data.qrCodeId,
          catalogItemId: data.catalogItemId,
        },
      },
    });

    if (existing) {
      return { success: false, message: "This item is already in the QR menu" };
    }

    const menuItem = await prisma.qRMenuItem.create({
      data: {
        businessId: data.businessId,
        qrCodeId: data.qrCodeId,
        catalogItemId: data.catalogItemId,
        isAvailable: data.isAvailable ?? true,
        sortOrder: data.sortOrder ?? 0,
        price: data.price ?? undefined,
      },
    });

    return {
      success: true,
      message: "Menu item added successfully",
      data: { id: menuItem.id },
    };
  } catch (error) {
    console.error("Create menu item error:", error);
    return { success: false, message: "Failed to add menu item" };
  }
}

export async function updateMenuItem(
  id: string,
  data: UpdateMenuItemSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.price !== undefined) updateData.price = data.price;

    await prisma.qRMenuItem.update({ where: { id }, data: updateData });

    return { success: true, message: "Menu item updated successfully" };
  } catch (error) {
    console.error("Update menu item error:", error);
    return { success: false, message: "Failed to update menu item" };
  }
}

export async function getMenuItem(id: string): Promise<MenuItemWithCatalog | null> {
  return prisma.qRMenuItem.findUnique({
    where: { id },
    include: {
      catalogItem: { select: { id: true, name: true, imageUrl: true, type: true } },
    },
  }) as Promise<MenuItemWithCatalog | null>;
}

export async function listMenuItems(qrCodeId: string): Promise<MenuItemWithCatalog[]> {
  return prisma.qRMenuItem.findMany({
    where: { qrCodeId },
    include: {
      catalogItem: { select: { id: true, name: true, imageUrl: true, type: true } },
    },
    orderBy: { sortOrder: "asc" },
  }) as Promise<MenuItemWithCatalog[]>;
}

export async function deleteMenuItem(id: string): Promise<ActionResponse> {
  try {
    await prisma.qRMenuItem.delete({ where: { id } });
    return { success: true, message: "Menu item removed successfully" };
  } catch (error) {
    console.error("Delete menu item error:", error);
    return { success: false, message: "Failed to remove menu item" };
  }
}

export async function setMenuItemAvailability(
  id: string,
  isAvailable: boolean,
): Promise<ActionResponse> {
  try {
    await prisma.qRMenuItem.update({
      where: { id },
      data: { isAvailable },
    });
    return {
      success: true,
      message: `Item ${isAvailable ? "enabled" : "disabled"} successfully`,
    };
  } catch (error) {
    console.error("Set availability error:", error);
    return { success: false, message: "Failed to update availability" };
  }
}
