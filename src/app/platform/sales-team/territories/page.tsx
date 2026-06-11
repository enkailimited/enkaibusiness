import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function TerritoriesPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Territories" description="Manage your territories." />
      <Card>
        <CardHeader><CardTitle className="text-base">Territories</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <MapPin className="mb-4 h-12 w-12" />
          <p className="text-sm">Territories management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
