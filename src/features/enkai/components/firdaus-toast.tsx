"use client";

import { useEffect, useState, useRef } from "react";
import { useFirdausContext } from "../provider/firdaus-context";

interface Props {
  userName?: string;
}

export function FirdausToast({ userName }: Props) {
  const { state, actions } = useFirdausContext();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [spoken, setSpoken] = useState(false);
  const greetedRef = useRef(false);

  useEffect(() => {
    if (greetedRef.current) return;
    const shouldGreet = typeof window !== "undefined" && sessionStorage.getItem("firdaus_greet") === "true";
    if (!shouldGreet) return;

    greetedRef.current = true;
    try { sessionStorage.removeItem("firdaus_greet"); } catch {}

    const doGreeting = async () => {
      const name = userName || state.userId || "Mfanyabiashara";

      let greetingMessage = `Karibu ${name}. Mimi ni Firdaus. Nipo hapa kukusaidia. Ukihitaji msaada wowote sema tu "Dausi".`;

      try {
        if (state.businessId) {
          const { getGreetingDataAction } = await import("../actions/greeting-actions");
          const data = await getGreetingDataAction(state.businessId, state.userId || "");

          if (data) {
            const parts: string[] = [];
            const displayName = data.snapshot.userName || userName || "Mfanyabiashara";
            parts.push(`Mauzo ya leo ni Tsh ${data.snapshot.todaySales.toLocaleString()}.`);
            if (data.snapshot.lowStockCount > 0) {
              parts.push(`Bidhaa ${data.snapshot.lowStockCount} zinahitaji kuagizwa.`);
            }
            if (data.snapshot.overdueCount > 0) {
              parts.push(`Madeni ${data.snapshot.overdueCount} yamechelewa kulipwa.`);
            }
            if (data.snapshot.healthScore) {
              parts.push(`Business Health Score ni ${data.snapshot.healthScore}/100 (${data.snapshot.healthGrade}).`);
            }
            greetingMessage = `Karibu ${displayName}.\n\n${parts.join("\n")}\n\nNipo tayari kusaidia.`;
          }
        }
      } catch {}

      setMessage(greetingMessage);
      setVisible(true);
      setTimeout(() => setVisible(false), 14000);
    };

    doGreeting();
  }, [userName, state.businessId, state.userId]);

  useEffect(() => {
    if (!visible || spoken) return;
    setSpoken(true);
    const name = userName?.split(" ")[0] || "Mfanyabiashara";
    actions.speak(`Habari ${name}. Mimi ni Firdaus. Nakusikiliza sasa. Ukihitaji msaada wakati wowote, sema tu Dausi, na nitakusaidia.`);
  }, [visible, spoken, userName, actions]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4 animate-in slide-in-from-bottom-4 fade-in duration-500 md:bottom-5">
      <div className="rounded-xl border bg-background shadow-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">✦</span>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
