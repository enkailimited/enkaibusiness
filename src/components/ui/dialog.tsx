"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

const DialogRoot = ({ children, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? (
    <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
  ) : (
    <Drawer.Root {...props}>{children}</Drawer.Root>
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
          "inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t",
          className,
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof Drawer.Content>)}
      >
        <div className="mx-auto mb-3 mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        <div className="px-6 pb-6">{children}</div>
        <div className="h-[env(safe-area-inset-bottom,32px)]" />
      </Drawer.Content>
    </Drawer.Portal>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

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

const Dialog = DialogRoot;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
