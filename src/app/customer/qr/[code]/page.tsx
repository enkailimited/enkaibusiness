import { notFound } from "next/navigation";
import Link from "next/link";
import { QrCommerceBrowse } from "@/features/qr/components/experiences/commerce-browse";
import { QrRestaurantMenu } from "@/features/qr/components/experiences/restaurant-menu";
import { QrGeneralInfo } from "@/features/qr/components/experiences/general-info";

export const dynamic = "force-dynamic";

export default async function QRScanPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const experience = await getQRExperienceByCode(code);
  if (!experience) return notFound();

  // Record scan asynchronously
  recordQRScan(experience.id).catch(() => {});

  const industry = getIndustryForMode(experience.mode);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/5 border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{experience.business.name}</p>
            {experience.branch && <p className="text-xs text-muted-foreground">{experience.branch.name}</p>}
          </div>
          <Link href={`/customer/catalog?business=${experience.business.slug}`} className="text-xs text-primary hover:underline">
            View Full Catalog
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Industry-resolved experience */}
        {experience.mode === "COMMERCE_BROWSE" && (
          <QrCommerceBrowse businessId={experience.business.id} businessSlug={experience.business.slug} currency={experience.business.currency} />
        )}
        {experience.mode === "RESTAURANT_MENU" && (
          <QrRestaurantMenu businessId={experience.business.id} businessSlug={experience.business.slug} currency={experience.business.currency} />
        )}
        {(experience.mode === "GENERAL_INFO" || !["COMMERCE_BROWSE", "RESTAURANT_MENU"].includes(experience.mode)) && (
          <QrGeneralInfo experience={experience} industry={industry} />
        )}

        {experience.destinationUrl && (
          <div className="text-center mt-8">
            <a
              href={experience.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-block hover:bg-primary/90"
            >
              Open Full Experience
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
