"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { useSound } from "@/hooks/use-sound";
import { cn } from "@/lib/utils";

const ENTRY_SOUND = "/audio/screen-laucher-sound/Glass%20Button%20Tap%20(1).mp3";

export function Modal({ children, ...props }: React.ComponentPropsWithoutRef<typeof Drawer.Root>) {
  const { play } = useSound(ENTRY_SOUND);
  const handleOpenChange = React.useCallback((open: boolean) => {
    if (open) play();
    props.onOpenChange?.(open);
  }, [props.onOpenChange, play]);

  return (
    <Drawer.Root {...props} onOpenChange={handleOpenChange}>
      {children}
    </Drawer.Root>
  );
}

export const ModalTrigger = Drawer.Trigger;

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
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <Drawer.Content
        className={cn(
          "fixed z-50 bg-background p-6 shadow-xl",
          "inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t pb-[env(safe-area-inset-bottom,16px)]",
          "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-lg sm:rounded-2xl sm:border sm:pb-6",
          className,
        )}
      >
        <DialogPrimitive.Title className="sr-only">{title || "Dialog"}</DialogPrimitive.Title>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
        <div className="flex flex-col gap-2">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="mt-4">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}
