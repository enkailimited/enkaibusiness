import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { PlatformSettingsForm } from "@/features/platform/components/platform-settings-form";

export default async function PlatformSettingsPage() {
  await requireAuth();

  const settings = await prisma.setting.findMany({
    where: { userId: null, businessId: null },
  });

  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  const name = map["platform_name"] ?? "Enkai Business";
  const email = map["support_email"] ?? "support@enkai.com";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Platform Settings" description="Manage platform configuration" />
      <PlatformSettingsForm initialName={name} initialEmail={email} />
    </div>
  );
}
