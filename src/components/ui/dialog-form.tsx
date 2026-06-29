"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface DialogFormProps {
  title: string;
  description: string;
  triggerLabel?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DialogForm({
  title,
  description,
  triggerLabel = "Add",
  children,
  open: controlledOpen,
  onOpenChange,
}: DialogFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && formRef.current) {
      const form = formRef.current.querySelector("form");
      if (form) form.reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div ref={formRef} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
