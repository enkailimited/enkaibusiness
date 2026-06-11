"use client";

import { Bell, Search, User } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-4 md:hidden">
        <Logo variant="blue" width={28} height={28} />
        <span className="font-bold">Enkai</span>
      </div>

      <div className="hidden md:flex flex-1 items-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="h-9 w-full rounded-full border bg-muted/50 pl-9 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full border bg-muted/20">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
