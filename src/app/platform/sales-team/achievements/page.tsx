import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function AchievementsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Achievements" description="Manage your achievements." />
      <Card>
        <CardHeader><CardTitle className="text-base">Achievements</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Award className="mb-4 h-12 w-12" />
          <p className="text-sm">Achievements management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
