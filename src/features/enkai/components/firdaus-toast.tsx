"use client";

import { useEffect, useState } from "react";
import { useFirdausContext } from "../provider/firdaus-context";

interface Props {
  userName?: string;
}

export function FirdausToast({ userName }: Props) {
  const { state, actions } = useFirdausContext();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (state.hasGreeted || !state.businessId) return;

    const doGreeting = async () => {
      actions.markGreeted();

      try {
        const { getGreetingDataAction } = await import("../actions/greeting-actions");
        const userId = state.userId || "";
        const data = await getGreetingDataAction(state.businessId, userId);
        const { snapshot } = data;
        const name = data.userName || userName || "Mfanyabiashara";

        let greeting = `Karibu ${name}. Mimi ni Firdaus. Nipo hapa kukusaidia kuendesha biashara yako. Ukihitaji msaada wowote sema tu "Firdaus".`;

        const parts: string[] = [];
        if (snapshot.todaySales > 0) {
          parts.push(`Kwa sasa mauzo ya leo ni Tsh ${snapshot.todaySales.toLocaleString()}.`);
        }
        if (snapshot.lowStockCount > 0) {
          const names = snapshot.criticalStockNames.slice(0, 3).join(", ");
          parts.push(`Bidhaa ${snapshot.lowStockCount} zinakaribia kuisha stoo`);
          if (names) parts[parts.length - 1] += ` (${names})`;
          parts[parts.length - 1] += ".";
        }
        if (snapshot.overdueDebtCount > 0 && snapshot.topDebtorName) {
          parts.push(`${snapshot.topDebtorName} ana deni kubwa la Tsh ${Number(snapshot.topDebtAmount || 0).toLocaleString()} ambalo halijalipwa.`);
        }
        if (snapshot.pendingPOCount > 0) {
          parts.push(`Purchase Order ${snapshot.pendingPOCount} hazijakamilika.`);
        }

        if (parts.length > 0) {
          greeting += `\n\n${parts.join("\n")}`;
        }

        setMessage(greeting);
      } catch {
        setMessage(`Karibu ${userName || "Mfanyabiashara"}. Mimi ni Firdaus. Nipo hapa kukusaidia kuendesha biashara yako. Ukihitaji msaada wowote sema tu "Firdaus".`);
      }

      setVisible(true);
      setTimeout(() => setVisible(false), 12000);
    };

    doGreeting();
  }, [state.hasGreeted, state.businessId, state.userId, userName, actions]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
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
