import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Orders" description="Manage your orders." />
      <Card>
        <CardHeader><CardTitle className="text-base">Orders</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ShoppingBag className="mb-4 h-12 w-12" />
          <p className="text-sm">Orders management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
