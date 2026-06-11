import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

export default function TargetsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Targets" description="Manage your targets." />
      <Card>
        <CardHeader><CardTitle className="text-base">Targets</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Target className="mb-4 h-12 w-12" />
          <p className="text-sm">Targets management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
