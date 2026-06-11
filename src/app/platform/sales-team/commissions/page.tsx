import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function CommissionsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Commissions" description="Manage your commissions." />
      <Card>
        <CardHeader><CardTitle className="text-base">Commissions</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <DollarSign className="mb-4 h-12 w-12" />
          <p className="text-sm">Commissions management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
