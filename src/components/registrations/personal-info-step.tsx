"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, AtSign, Phone, Hash } from "lucide-react";

export function PersonalInfoStep() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <User className="h-4 w-4" />
        Personal Information
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">
          <AtSign className="mr-1 inline h-3 w-3" />
          Email
        </Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">
            <Phone className="mr-1 inline h-3 w-3" />
            Phone
          </Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">
            <Hash className="mr-1 inline h-3 w-3" />
            Username
          </Label>
          <Input id="username" name="username" autoComplete="username" required />
        </div>
      </div>
    </div>
  );
}
