import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "blue" | "white";
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ variant = "blue", className, width = 140, height = 35 }: LogoProps) {
  const isSquare = width === height;
  let src = variant === "white" ? "/images/logo-white.svg" : "/images/logo-blue.svg";
  
  if (isSquare) {
    src = "/images/logo-icon.svg";
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
