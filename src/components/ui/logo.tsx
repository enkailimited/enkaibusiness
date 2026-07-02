"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  variant?: "blue" | "white";
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ variant: variantProp, className, width = 140, height = 35 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const isSquare = width === height;

  let src: string;
  if (isSquare) {
    src = isDark ? "/images/logo-icon-white.svg" : "/images/logo-icon.svg";
  } else {
    const variant = variantProp ?? (isDark ? "white" : "blue");
    src = variant === "white" ? "/images/logo-white.svg" : "/images/logo-blue.svg";
  }

  return (
    <Image
      src={src}
      alt="Enkai Business"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      style={{ height: isSquare ? undefined : "auto" }}
      priority
    />
  );
}
