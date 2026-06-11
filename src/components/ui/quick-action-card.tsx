"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { UnavailableAction } from "./unavailable-action";

interface QuickActionCardProps {
  title: string;
  href?: string;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  className?: string;
  requiredPermission?: string;
  hasPermission?: boolean;
}

export function QuickActionCard({
  title,
  href,
  icon: Icon,
  color = "text-primary",
  bg = "bg-primary/10",
  className,
  requiredPermission,
  hasPermission,
}: QuickActionCardProps) {
  const [showAlert, setShowAlert] = useState(false);
  const permitted = hasPermission !== false;
  const isDisabled = requiredPermission !== undefined && !permitted;

  function handleClick(e: React.MouseEvent) {
    if (isDisabled) {
      e.preventDefault();
      setShowAlert(true);
    }
  }

  const content = (
    <motion.div
      whileHover={isDisabled ? undefined : { scale: 1.05 }}
      whileTap={isDisabled ? undefined : { scale: 0.95 }}
      className={cn("w-full", isDisabled && "cursor-not-allowed")}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-4 text-center transition-all",
          isDisabled
            ? "opacity-50 hover:border-border hover:shadow-none"
            : "hover:border-primary/20 hover:shadow-md",
          className,
        )}
      >
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm", bg, color)}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-xs font-semibold tracking-tight text-foreground/80 md:text-sm">
          {title}
        </span>
      </div>
    </motion.div>
  );

  return (
    <>
      {href && !isDisabled ? (
        <Link href={href} onClick={handleClick}>
          {content}
        </Link>
      ) : (
        <div onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") handleClick(e as any); }}>
          {content}
        </div>
      )}
      <UnavailableAction
        open={showAlert}
        onOpenChange={setShowAlert}
        description={`You do not have permission to access "${title}". Contact your administrator if you need access.`}
      />
    </>
  );
}
