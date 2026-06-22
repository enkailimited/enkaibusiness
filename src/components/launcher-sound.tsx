"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/hooks/use-sound";

export function LauncherSound() {
  const { play } = useSound("/audio/screen-laucher-sound/Glass%20Button%20Tap%20(1).mp3");
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    play();
  }, [play]);

  return null;
}
