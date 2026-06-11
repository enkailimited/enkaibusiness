"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { getWorkspaceSettingsAction, saveWorkspaceSettingsAction } from "@/features/settings/actions";

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<{ id: string; name: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    getWorkspaceSettingsAction().then((w) => {
      if (w) {
        setWorkspace(w);
        setName(w.name);
        setDescription(w.description);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!workspace) return;
    setSaving(true);
    await saveWorkspaceSettingsAction(workspace.id, name, description);
    setSaving(false);
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Workspace Settings" description="Configure your workspace" />

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this workspace for?" />
              </div>
            </>
          )}
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
