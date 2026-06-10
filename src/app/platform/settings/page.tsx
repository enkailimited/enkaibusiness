import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Manage platform configuration"
      />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Name</label>
              <Input defaultValue="Enkai Business" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <Input type="email" defaultValue="support@enkai.com" />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
