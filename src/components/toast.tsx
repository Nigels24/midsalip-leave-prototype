"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Toast = { id: number; msg: string; tone: "ok" | "err" };
const Ctx = createContext<(msg: string, tone?: "ok" | "err") => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
            {t.tone === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
