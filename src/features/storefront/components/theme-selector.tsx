"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { setActiveThemeAction } from "../actions";

interface Theme {
  id: string; name: string; isActive: boolean;
  layout: string; headerStyle: string; cardStyle: string;
}

export function ThemeSelector({ themes, storefrontId }: { themes: Theme[]; storefrontId: string }) {
  const router = useRouter();
//   const [state, action, pending] = useActionState(async (prev: unknown, formData: FormData) => {
//     const themeId = formData.get("themeId") as string;
//     if (!themeId) return null;
//     const res = await setActiveThemeAction(storefrontId, themeId);
//     if (res.success) router.refresh();
//     return res;
//   }, null);

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-lg font-semibold mb-4">Themes</h2>
      <form action={action} className="space-y-3">
        <div className="grid gap-3">
          {themes.map((theme) => (
            <label
              key={theme.id}
              className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                theme.isActive ? "border-primary bg-primary/5" : "hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="themeId"
                  value={theme.id}
                  defaultChecked={theme.isActive}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {theme.layout} · {theme.headerStyle} header · {theme.cardStyle} cards
                  </p>
                </div>
              </div>
              {theme.isActive && <span className="text-xs text-primary font-medium">Active</span>}
            </label>
          ))}
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Apply Theme
        </Button>
      </form>
    </div>
  );
}
