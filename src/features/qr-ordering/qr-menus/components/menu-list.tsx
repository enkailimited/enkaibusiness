import { requireAuth } from "@/server/auth";
import { listMenuItems } from "../services/menu-service";
import { MenuTableClient } from "./menu-table-client";

interface MenuListProps {
  qrCodeId: string;
}

export async function MenuList({ qrCodeId }: MenuListProps) {
  await requireAuth();
  const items = await listMenuItems(qrCodeId);

  return <MenuTableClient items={items} />;
}
