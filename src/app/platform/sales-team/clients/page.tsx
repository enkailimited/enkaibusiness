import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Clients" description="Manage your clients." />
      <Card>
        <CardHeader><CardTitle className="text-base">Clients</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="mb-4 h-12 w-12" />
          <p className="text-sm">Clients management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
