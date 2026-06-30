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

let sharedAudioContext: AudioContext | null = null;

function playBeep() {
  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext();
    }
    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume();
    }
    const osc = sharedAudioContext.createOscillator();
    const gain = sharedAudioContext.createGain();
    osc.connect(gain);
    gain.connect(sharedAudioContext.destination);
    osc.frequency.value = 440;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.2, sharedAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioContext.currentTime + 0.2);
    osc.start(sharedAudioContext.currentTime);
    osc.stop(sharedAudioContext.currentTime + 0.2);
  } catch {}
}

export function UnavailableAction({
  open,
  onOpenChange,
  title = "Access Restricted",
  description = "You do not have the required permissions to access this feature. Contact your administrator if you need access.",
}: UnavailableActionProps) {
  useEffect(() => {
    if (open) playBeep();
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
