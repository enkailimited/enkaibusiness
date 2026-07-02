import { notFound } from "next/navigation";
import Link from "next/link";
import { getQRExperienceById } from "@/features/qr/services/qr-service";
import { PageHeader } from "@/components/layout/page-header";
import { QrActions } from "@/features/qr/components/qr-actions";
import { QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QRExperienceDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const exp = await getQRExperienceById(id);
  if (!exp) return notFound();

  return (
    <div className="space-y-6 pb-10">
      <Link href="/platform/sales-team/qr" className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to QR experiences
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <div>
            <PageHeader title={exp.code} description={exp.business.name} />
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                exp.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                exp.status === "INACTIVE" ? "bg-gray-100 text-gray-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {exp.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{exp.mode.toLowerCase().replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
        <QrActions experienceId={exp.id} status={exp.status} code={exp.code} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Code</dt>
              <dd className="font-medium font-mono">{exp.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Mode</dt>
              <dd className="font-medium capitalize">{exp.mode.toLowerCase().replace(/_/g, " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Label</dt>
              <dd className="font-medium">{exp.label || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Business</dt>
              <dd className="font-medium">{exp.business.name}</dd>
            </div>
            {exp.branch && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Branch</dt>
                <dd className="font-medium">{exp.branch.name}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Scans</dt>
              <dd className="font-medium">{exp.scanCount}</dd>
            </div>
            {exp.lastScannedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Scanned</dt>
                <dd className="font-medium">{new Date(exp.lastScannedAt).toLocaleString()}</dd>
              </div>
            )}
            {exp.activatedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Activated</dt>
                <dd className="font-medium">{new Date(exp.activatedAt).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold">QR Link</h2>
          <p className="text-sm text-muted-foreground">
            Scan link: <code className="bg-muted px-2 py-1 rounded text-xs">
              {process.env.NEXT_PUBLIC_APP_URL || "https://enkai.app"}/customer/qr/{exp.code}
            </code>
          </p>

          {exp.destinationUrl && (
            <div>
              <p className="text-sm font-medium mb-1">Custom Destination</p>
              <a href={exp.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                {exp.destinationUrl}
              </a>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-3xl font-mono font-bold tracking-[0.3em]">{exp.code}</p>
            <p className="text-xs text-muted-foreground mt-1">QR Code Reference</p>
          </div>
        </div>
      </div>

      {exp.installation && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">Installation</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Location</dt>
              <dd className="font-medium">{exp.installation.location || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Material</dt>
              <dd className="font-medium">{exp.installation.material}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Size</dt>
              <dd className="font-medium">{exp.installation.size}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Installed</dt>
              <dd className="font-medium">{new Date(exp.installation.installedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
