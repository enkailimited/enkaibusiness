"use client";

import { useEffect } from "react";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface UnavailableActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function UnavailableAction({
  open,
  onOpenChange,
  title = "Access Restricted",
  description = "You do not have the required permissions to access this feature. Contact your administrator if you need access.",
}: UnavailableActionProps) {
  useEffect(() => {
    if (open) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        osc.type = "sawtooth";
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title={title} description={description}>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-center text-sm text-muted-foreground">{description}</p>
          <Button variant="default" className="mt-2" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
