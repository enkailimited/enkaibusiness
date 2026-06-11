import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall } from "lucide-react";

export default function LeadsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Leads" description="Manage your leads." />
      <Card>
        <CardHeader><CardTitle className="text-base">Leads</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <PhoneCall className="mb-4 h-12 w-12" />
          <p className="text-sm">Leads management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
