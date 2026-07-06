"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

const VaulDialogContext = React.createContext(false);

const DialogRoot = ({ children, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? (
    <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
  ) : (
    <Drawer.Root
      fixed
      {...(props as React.ComponentProps<typeof Drawer.Root>)}
    >
      {children}
    </Drawer.Root>
  );
};

function DialogTrigger({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean; className?: string; onClick?: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const Comp = isDesktop ? DialogPrimitive.Trigger : Drawer.Trigger;
  return <Comp asChild={asChild} {...props}>{children}</Comp>;
}
DialogTrigger.displayName = "DialogTrigger";

function DialogPortal({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const Comp = isDesktop ? DialogPrimitive.Portal : Drawer.Portal;
  return <Comp>{children}</Comp>;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />;
  }
  return <Drawer.Overlay className={cn("fixed inset-0 z-50 bg-black/80", className)} />;
});
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & React.ComponentPropsWithoutRef<typeof Drawer.Content>
>(({ className, children, ...props }, ref) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const bodyRef = React.useRef<HTMLDivElement>(null);

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
    const el = bodyRef.current;
    if (!el) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!el || !el.contains(target)) return;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && target.tagName !== "SELECT") return;

      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  if (isDesktop) {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
            "max-h-[85dvh] overflow-y-auto rounded-lg",
            className,
          )}
          {...(props as React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>)}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  }

  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/80" />
      <Drawer.Content
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "fixed z-50 bg-background shadow-lg",
          "inset-x-0 bottom-0 rounded-t-2xl border-t",
          "flex flex-col overflow-hidden",
          "max-h-[calc(100dvh-40px)]",
          className,
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof Drawer.Content>)}
      >
        <div className="shrink-0 flex justify-center pt-2 pb-1">
          <div className="h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        </div>

        {headerEl && (
          <div className="shrink-0 px-6 pb-3 bg-background z-10">
            <VaulDialogContext.Provider value={true}>
              {headerEl}
            </VaulDialogContext.Provider>
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

        <div className="shrink-0 h-[env(safe-area-inset-bottom,0px)] bg-background" />
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
>(({ className, ...props }, ref) => {
  const isVaul = React.useContext(VaulDialogContext);
  if (isVaul) {
    return (
      <h2
        ref={ref as React.Ref<HTMLHeadingElement>}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
      />
    );
  }
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const isVaul = React.useContext(VaulDialogContext);
  if (isVaul) {
    return (
      <p
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn("text-sm text-muted-foreground", className)}
        {...(props as React.HTMLAttributes<HTMLParagraphElement>)}
      />
    );
  }
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
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

const Dialog = DialogRoot;

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
  VaulDialogContext,
};
