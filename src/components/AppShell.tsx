"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronDown, LogOut, Menu, RotateCcw, UserCog, X } from "lucide-react";
import { APP } from "@/config/app";
import { NAV } from "@/config/nav";
import { ROLE_LABEL, fullName } from "@/data/employees";
import { office } from "@/data/offices";
import { canAct } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { cn } from "./ui";
import { Seal } from "./Seal";
import { useToast } from "./toast";
import { useConfirm } from "./confirm";

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, user, db, logout, reset, login, commit } = useStore();
  const router = useRouter();
  const path = usePathname().replace(/\/$/, "") || "/";
  const toast = useToast();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!ready || !user)
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>;

  const pending = db.applications.filter((a) => canAct(db, a, user.id)).length;
  const myNotifs = db.notifications.filter((n) => n.userId === user.id);
  const unread = myNotifs.filter((n) => !n.read).length;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  const markAllRead = () =>
    commit({ ...db, notifications: db.notifications.map((n) => (n.userId === user.id ? { ...n, read: true } : n)) });

  const openNotif = (id: string, appId?: string) => {
    commit({ ...db, notifications: db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    setBell(false);
    if (appId) router.push(`/application?id=${appId}`);
  };

  const switchTo = (username: string) => {
    login(username);
    setMenu(false);
    router.push("/dashboard");
  };

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <Seal className="h-10 w-10 shrink-0" />
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">{APP.shortName}</p>
          <p className="text-[11px] text-brand-100/80">{APP.agency}</p>
        </div>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((n) => {
          const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href));
          const count = n.badge === "approvals" ? pending : n.badge === "notifications" ? unread : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active ? "bg-white/15 font-semibold text-white" : "text-brand-100/85 hover:bg-white/10 hover:text-white",
              )}
            >
              <n.icon size={18} />
              <span className="flex-1">{n.label}</span>
              {count > 0 && <span className="rounded-full bg-accent-400 px-2 py-0.5 text-[11px] font-bold text-brand-900">{count}</span>}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-brand-100/70">
        Prototype · sample data only
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64 print:pl-0">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 bg-brand-900 lg:block">{sidebar}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-brand-900">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 text-white/70" aria-label="Close menu">
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button onClick={() => setOpen(true)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{APP.fullName}</p>
          <p className="truncate text-xs text-slate-500">{office(user.officeId)?.name}</p>
        </div>

        <div className="relative" ref={bellRef}>
          <button onClick={() => setBell((b) => !b)} className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </button>
          {bell && (
            <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {myNotifs.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>}
                {myNotifs.slice(0, 8).map((n) => (
                  <button key={n.id} onClick={() => openNotif(n.id, n.appId)} className={cn("block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50", !n.read && "bg-brand-50/60")}>
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.body}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.at)}</p>
                  </button>
                ))}
              </div>
              <Link href="/notifications" onClick={() => setBell(false)} className="block bg-slate-50 px-4 py-2.5 text-center text-xs font-medium text-brand-600 hover:underline">
                View all notifications
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-slate-800">{fullName(user)}</span>
              <span className="block text-[11px] text-slate-500">{ROLE_LABEL[user.role]}</span>
            </span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold">{fullName(user)}</p>
                <p className="text-xs text-slate-500">
                  {user.position} · {ROLE_LABEL[user.role]}
                </p>
              </div>
              <div className="border-b border-slate-100 p-2">
                <p className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <UserCog size={13} /> Demo: switch user
                </p>
                {[
                  ["jpepito", "Employee"],
                  ["treasurer", "Department Head"],
                  ["hrmo", "HRMO"],
                  ["mayor", "Approving Authority"],
                ].map(([u, label]) => {
                  const e = db.employees.find((x) => x.username === u);
                  if (!e) return null;
                  return (
                    <button key={u} onClick={() => switchTo(u)} className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50", e.id === user.id && "bg-brand-50")}>
                      <span>{fullName(e)}</span>
                      <span className="text-[11px] text-slate-500">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: "Reset demo data?",
                    message: "This restores all sample data and discards anything entered in this browser.",
                    tone: "danger",
                    confirmLabel: "Reset data",
                  });
                  if (!ok) return;
                  reset();
                  setMenu(false);
                  toast("Sample data restored.");
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw size={16} /> Reset demo data
              </button>
              <button
                onClick={() => {
                  logout();
                  toast("Signed out.");
                  router.replace("/login");
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
