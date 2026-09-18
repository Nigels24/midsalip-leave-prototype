"use client";
// Prototype "database": the whole state lives in the browser (localStorage).
// Replace these calls with API / server actions when the real backend exists.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { buildSeed, DB_VERSION } from "@/data/seed";
import type { DbState } from "./types";
import type { Employee } from "@/data/employees";

const KEY = "mmh-leave-db";
const SESSION_KEY = "mmh-leave-user";

interface Ctx {
  ready: boolean;
  db: DbState;
  user: Employee | null;
  login: (username: string) => boolean;
  logout: () => void;
  commit: (next: DbState) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

function load(): DbState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DbState;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {}
  const seed = buildSeed();
  save(seed);
  return seed;
}

function save(db: DbState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}

const EMPTY: DbState = { version: DB_VERSION, employees: [], applications: [], ledger: [], notifications: [], audit: [], lastAccrualMonth: "" };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbState>(EMPTY);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setDb(load());
    try {
      setUserId(localStorage.getItem(SESSION_KEY));
    } catch {}
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setDb(JSON.parse(e.newValue));
      if (e.key === SESSION_KEY) setUserId(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: DbState) => {
    setDb(next);
    save(next);
  }, []);

  const login = useCallback(
    (username: string) => {
      const u = db.employees.find((e) => e.username.toLowerCase() === username.trim().toLowerCase() && e.active);
      if (!u) return false;
      setUserId(u.id);
      try {
        localStorage.setItem(SESSION_KEY, u.id);
      } catch {}
      return true;
    },
    [db.employees],
  );

  const logout = useCallback(() => {
    setUserId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const reset = useCallback(() => {
    const seed = buildSeed();
    commit(seed);
  }, [commit]);

  const user = useMemo(() => db.employees.find((e) => e.id === userId) ?? null, [db.employees, userId]);

  return <StoreCtx.Provider value={{ ready, db, user, login, logout, commit, reset }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}

/** Reads a ?query value. Pages using this are wrapped in <Suspense> by AppShell / PublicShell. */
export function useQuery(name: string) {
  return useSearchParams().get(name);
}
