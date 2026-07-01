"use client";

import { useTheme } from "@/components/ui/theme-provider";
import { useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const uiStoreTheme = useUIStore((s) => s.theme);
  const setUITheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    if (theme !== uiStoreTheme) {
      setUITheme(theme);
    }
  }, [theme, uiStoreTheme, setUITheme]);

  function handleThemeChange(value: string) {
    setTheme(value);
    setUITheme(value as "light" | "dark" | "system");
  }

  const currentIcon = themes.find((t) => t.value === theme);
  const Icon = currentIcon?.icon ?? Monitor;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors focus:outline-none"
          aria-label="Toggle theme"
        >
          <Icon className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[140px] overflow-hidden rounded-xl border bg-background p-1 shadow-xl"
        >
          {themes.map((t) => {
            const TIcon = t.icon;
            const isActive = theme === t.value;
            return (
              <DropdownMenu.Item
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted focus:outline-none focus:bg-muted"
              >
                <TIcon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{t.label}</span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
