import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="My Sales" description="Track your sales records and performance." />
      <Card>
        <CardHeader><CardTitle className="text-base">Sales Records</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BarChart3 className="mb-4 h-12 w-12" />
          <p className="text-sm">Sales records coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
