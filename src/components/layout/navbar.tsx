"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/features/users/components/user-avatar";
import { useAuth } from "@/features/auth/components/auth-provider";
import { authClient } from "@/lib/auth-client";
import { Bell, User, ChevronDown, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavbarSlots } from "./navbar-slots";

interface NavbarProps {
  profileHref: string;
  showSearch?: boolean;
}

export function Navbar({ profileHref, showSearch = false }: NavbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { branchSwitcher } = useNavbarSlots();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : "User";

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3 md:gap-10">
        <div className="flex items-center gap-3">
          <Logo variant="blue" width={22} height={22} />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm">enkai</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">business</span>
          </div>
        </div>
        {branchSwitcher && (
          <div className="hidden md:block">{branchSwitcher}</div>
        )}
        {showSearch && (
          <div className="hidden md:flex max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-56 rounded-full border bg-muted/40 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-full border bg-muted/30 px-2 py-1 hover:bg-muted transition-colors focus:outline-none">
              <UserAvatar
                firstName={user?.firstName || "U"}
                lastName={user?.lastName || "S"}
                avatarUrl={user?.avatarUrl ?? null}
                className="h-7 w-7"
              />
              <span className="hidden text-sm font-medium md:block max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[220px] overflow-hidden rounded-xl border bg-background p-1 shadow-xl"
            >
              <div className="px-3 py-2.5 border-b mb-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

              <DropdownMenu.Item asChild>
                <Link
                  href={profileHref}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer focus:outline-none focus:bg-muted"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile & Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-muted" />

              <DropdownMenu.Item asChild>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer focus:outline-none focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
