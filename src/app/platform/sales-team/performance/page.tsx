import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function PerformancePage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Performance" description="Manage your performance." />
      <Card>
        <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <TrendingUp className="mb-4 h-12 w-12" />
          <p className="text-sm">Performance management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
