"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { useSound } from "@/hooks/use-sound";
import { cn } from "@/lib/utils";

const ENTRY_SOUND = "/audio/screen-laucher-sound/Glass%20Button%20Tap%20(1).mp3";

function Dialog({ children, ...props }: React.ComponentPropsWithoutRef<typeof Drawer.Root>) {
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

const DialogTrigger = Drawer.Trigger;

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <Drawer.Portal>{children}</Drawer.Portal>;
}

function DialogOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof Drawer.Overlay>) {
  return (
    <Drawer.Overlay className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
  );
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Drawer.Content>
>(({ className, children, ...props }, ref) => {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number>(0);
  const [maxHeight, setMaxHeight] = React.useState("calc(100dvh - 32px)");
  const [, forceUpdate] = React.useState(0);

  let headerEl: React.ReactNode = null;
  let footerEl: React.ReactNode = null;
  const bodyChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const t = child.type as React.ComponentType & { displayName?: string };
      if (t === DialogHeader || t.displayName === "DialogHeader") {
        headerEl = child;
        return;
      }
      if (t === DialogFooter || t.displayName === "DialogFooter") {
        footerEl = child;
        return;
      }
    }
    bodyChildren.push(child);
  });

  const hasLayout = headerEl !== null || footerEl !== null;

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
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/80" />
      <Drawer.Content
        ref={ref}
        style={{ maxHeight }}
        className={cn(
          "fixed z-50 bg-background shadow-lg",
          "inset-x-0 bottom-0 rounded-t-2xl border-t",
          "flex flex-col overflow-hidden",
          "md:inset-auto md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%] md:max-w-lg md:rounded-lg md:border md:max-h-[85dvh] md:overflow-y-auto md:block",
          className,
        )}
        {...props}
      >
        <div className="shrink-0 flex justify-center pt-2 pb-1 md:hidden">
          <div className="h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        </div>

        {headerEl && (
          <div className="shrink-0 px-6 pb-3 bg-background z-10">
            {headerEl}
          </div>
        )}

        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto min-h-0 px-6 pb-4"
        >
          {hasLayout ? bodyChildren : children}
        </div>

        {footerEl && (
          <div className="shrink-0 px-6 py-3 border-t bg-background z-10">
            {footerEl}
          </div>
        )}

        <div className="shrink-0 h-[env(safe-area-inset-bottom,0px)] bg-background md:hidden" />
      </Drawer.Content>
    </Drawer.Portal>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto min-h-0", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  );
});
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
