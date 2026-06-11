"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActionResponse } from "@/types/relationships";
import { savePlatformSettingsAction } from "@/features/platform/actions/settings-actions";

interface PlatformSettingsFormProps {
  initialName: string;
  initialEmail: string;
}

export function PlatformSettingsForm({ initialName, initialEmail }: PlatformSettingsFormProps) {
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(
    savePlatformSettingsAction,
    null,
  );

  const loading = false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="platform_name">
                  Platform Name
                </label>
                <Input
                  id="platform_name"
                  name="platform_name"
                  defaultValue={initialName}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="support_email">
                  Support Email
                </label>
                <Input
                  id="support_email"
                  name="support_email"
                  type="email"
                  defaultValue={initialEmail}
                  required
                />
              </div>
            </div>

            {state?.success === false && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
            {state?.success && (
              <p className="text-sm text-emerald-600">{state.message}</p>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
