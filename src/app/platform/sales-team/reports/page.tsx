import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Reports" description="Manage your reports." />
      <Card>
        <CardHeader><CardTitle className="text-base">Reports</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileBarChart className="mb-4 h-12 w-12" />
          <p className="text-sm">Reports management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
