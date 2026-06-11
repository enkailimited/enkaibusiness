"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;

export function ModalContent({
  children,
  title,
  description,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-0 right-0 bottom-0 z-50 w-full bg-background p-6 shadow-xl transition-all duration-300",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:max-w-lg",
          "sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "sm:data-[state=closed]:slide-out-to-bottom-10 sm:data-[state=open]:slide-in-from-bottom-10",
          "sm:rounded-2xl",
          "rounded-t-2xl",
          "max-h-[90vh] overflow-y-auto",
          "pb-[env(safe-area-inset-bottom,16px)]",
          className
        )}
      >
        {/* Drag handle for mobile */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
        <div className="flex flex-col gap-2">
          {title && <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>}
          {description && <DialogPrimitive.Description className="text-sm text-muted-foreground">{description}</DialogPrimitive.Description>}
        </div>
        <div className="mt-4">{children}</div>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
