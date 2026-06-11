"use client";

import { useEffect, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updateUserPreferencesAction, getUserPreferencesAction } from "../actions";
import type { UserPreferences } from "../types";

interface UserSettingsFormProps {
  businessId?: string;
  userId?: string;
}

export function UserSettingsForm({ userId }: UserSettingsFormProps) {
  const [settings, setSettings] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(
    updateUserPreferencesAction.bind(null, userId ?? ""),
    null,
  );

  useEffect(() => {
    if (!userId) return;
    getUserPreferencesAction(userId).then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, [userId]);

  if (!userId) {
    return <p className="text-sm text-muted-foreground">User context required</p>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <select
          id="language"
          name="language"
          defaultValue={settings?.language ?? "en"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
          <option value="fr">French</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <select
          id="theme"
          name="theme"
          defaultValue={settings?.theme ?? "system"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={settings?.timezone ?? "Africa/Dar_es_Salaam"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="Africa/Dar_es_Salaam">East Africa (EAT)</option>
          <option value="Africa/Nairobi">Nairobi (EAT)</option>
          <option value="Africa/Kampala">Kampala (EAT)</option>
          <option value="Africa/Lagos">Lagos (WAT)</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div className="space-y-3">
        {([
          { key: "notifications", label: "Enable notifications" },
          { key: "emailNotifications", label: "Email notifications" },
          { key: "smsNotifications", label: "SMS notifications" },
        ] as const).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <input
              id={key}
              name={key}
              type="checkbox"
              defaultChecked={(settings as Record<string, boolean | undefined>)?.[key] ?? true}
              className="h-4 w-4"
            />
            <Label htmlFor={key}>{label}</Label>
          </div>
        ))}
      </div>

      {state?.message && (
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Preferences"}
      </Button>
    </form>
  );
}
