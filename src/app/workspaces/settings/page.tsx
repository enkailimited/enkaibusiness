import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Settings"
        description="Configure your workspace"
      />

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Workspace Name</label>
            <Input defaultValue="My Workspace" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input placeholder="What is this workspace for?" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
