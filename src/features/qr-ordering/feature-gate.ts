import { prisma } from "@/server/db";

export async function requireQrOrderingEnabled(businessId: string): Promise<void> {
  const setting = await prisma.setting.findUnique({
    where: { businessId_key: { businessId, key: "qr_ordering_enabled" } },
  });

  const enabled = setting?.value === "true";

  if (!enabled) {
    throw new Error("QR ordering is not enabled for this business. Please enable it in your subscription settings first.");
  }
}
