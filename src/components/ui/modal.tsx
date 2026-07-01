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
    <Drawer.Root
      repositionInputs
      fixed
      {...props}
      onOpenChange={handleOpenChange}
    >
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
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number>(0);
  const [maxHeight, setMaxHeight] = React.useState("calc(100dvh - 32px)");
  const [, forceUpdate] = React.useState(0);

  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const gap = 32;
      const available = vv.height - (vv.offsetTop || 0) - gap;
      setMaxHeight(`${Math.max(available, 200)}px`);
    };

    vv.addEventListener("resize", update);
    update();
    return () => vv.removeEventListener("resize", update);
  }, []);

  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        forceUpdate((n) => n + 1);
      });
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!el.contains(target)) return;
      const tag = target.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;

      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <Drawer.Content
        style={{ maxHeight }}
        className={cn(
          "fixed z-50 bg-background shadow-xl",
          "inset-x-0 bottom-0 rounded-t-2xl border-t",
          "flex flex-col overflow-hidden",
          "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-lg sm:rounded-2xl sm:border sm:max-h-[85dvh] sm:overflow-y-auto sm:block",
          className,
        )}
      >
        <DialogPrimitive.Title className="sr-only">{title || "Dialog"}</DialogPrimitive.Title>

        <div className="shrink-0 flex justify-center pt-2 pb-1 sm:hidden">
          <div className="h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        </div>

        <div className="shrink-0 px-6 pt-1 pb-2 sm:p-0 sm:sr-only">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto min-h-0 px-6 pb-4 sm:p-0"
        >
          {children}
        </div>

        <div className="shrink-0 h-[env(safe-area-inset-bottom,0px)] bg-background sm:hidden" />
      </Drawer.Content>
    </Drawer.Portal>
  );
}
