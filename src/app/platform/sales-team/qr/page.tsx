import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { getQRExperiences } from "@/features/qr/services/qr-service";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function QRExperiencesPage() {
  const experiences = await getQRExperiences();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <PageHeader title="QR Experiences" description="Manage QR codes for all businesses" />
        <Link
          href="/platform/sales-team/qr/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New QR Experience
        </Link>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No QR experiences yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create QR experiences for your businesses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <Link
              key={exp.id}
              href={`/platform/sales-team/qr/${exp.id}`}
              className="block border rounded-lg p-4 hover:border-primary transition-colors bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium font-mono">{exp.code}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.business.name}</p>
                  {exp.label && <p className="text-xs text-muted-foreground">{exp.label}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    exp.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                    exp.status === "INACTIVE" ? "bg-gray-100 text-gray-800" :
                    exp.status === "DAMAGED" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {exp.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {exp.scanCount} scans
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span className="capitalize">{exp.mode.toLowerCase().replace(/_/g, " ")}</span>
                {exp.installation && <span>Installed at {exp.installation.location || "?"}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
