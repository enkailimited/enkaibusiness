"use client";

import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  className?: string;
}

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  className,
}: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl ?? undefined} />
      <AvatarFallback>{getInitials(firstName, lastName)}</AvatarFallback>
    </Avatar>
  );
}
