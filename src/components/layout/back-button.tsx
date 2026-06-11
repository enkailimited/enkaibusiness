"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="inline-flex items-center gap-1 px-2 py-1"
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline text-xs">Back</span>
    </Button>
  );
}
