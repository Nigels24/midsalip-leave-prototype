"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { emp, isOpen, toISODate } from "@/lib/engine";
import { OFFICES } from "@/data/offices";
import { HOLIDAYS } from "@/config/app";
import { leaveType } from "@/data/leaveTypes";
import { Button, Card, PageHeader, Select, cn } from "@/components/ui";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { db, user } = useStore();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [off, setOff] = useState(user?.role === "DEPT_HEAD" ? user.officeId : "");
  const [showPending, setShowPending] = useState(true);
  if (!user) return null;

  const first = new Date(ym.y, ym.m, 1);
  const cells: Date[] = [];
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  const apps = db.applications.filter((a) => {
    if (!(a.status === "APPROVED" || (showPending && isOpen(a.status)))) return false;
    return !off || emp(db, a.employeeId)?.officeId === off;
  });
  const today = toISODate(now);
  const move = (n: number) => setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));

  return (
    <>
      <PageHeader
        title="Leave Calendar"
        subtitle="See who is on leave to plan office staffing."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={off} onChange={(e) => setOff(e.target.value)} className="w-56" disabled={user.role === "DEPT_HEAD"}>
              <option value="">All offices</option>
              {OFFICES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={showPending} onChange={(e) => setShowPending(e.target.checked)} className="accent-[var(--brand-600)]" />
              Include pending
            </label>
          </div>
        }
      />
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => move(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </Button>
          <div className="text-center">
            <p className="font-semibold">{first.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</p>
            <button className="text-xs text-brand-600 hover:underline" onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() })}>
              Today
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => move(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-7">
            {DOW.map((d) => (
              <div key={d} className="border-b border-slate-100 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500">
                {d}
              </div>
            ))}
            {cells.map((d) => {
              const iso = toISODate(d);
              const inMonth = d.getMonth() === ym.m;
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              const hol = HOLIDAYS[iso];
              const todays = weekend || hol ? [] : apps.filter((a) => a.startDate <= iso && iso <= a.endDate);
              return (
                <div key={iso} className={cn("min-h-28 border-b border-r border-slate-100 p-1.5", !inMonth && "bg-slate-50/60", weekend && "bg-slate-50")}>
                  <div className="flex items-center justify-between">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", iso === today && "bg-brand-600 font-bold text-white", !inMonth && "text-slate-300")}>{d.getDate()}</span>
                    {hol && <span className="truncate text-[10px] text-red-500">{hol}</span>}
                  </div>
                  <div className="mt-1 space-y-1">
                    {todays.slice(0, 3).map((a) => {
                      const e = emp(db, a.employeeId)!;
                      const pending = a.status !== "APPROVED";
                      return (
                        <Link
                          key={a.id}
                          href={`/application?id=${a.id}`}
                          title={`${e.firstName} ${e.lastName} – ${leaveType(a.typeCode).name}${pending ? " (pending)" : ""}`}
                          className={cn(
                            "block truncate rounded px-1.5 py-0.5 text-[11px]",
                            pending ? "border border-dashed border-amber-400 bg-amber-50 text-amber-800" : a.typeCode === "SL" ? "bg-sky-100 text-sky-800" : "bg-brand-100 text-brand-900",
                          )}
                        >
                          {e.firstName} {e.lastName[0]}. · {a.typeCode}
                        </Link>
                      );
                    })}
                    {todays.length > 3 && <p className="px-1 text-[10px] text-slate-500">+{todays.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-100" /> Approved leave</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-100" /> Approved sick leave</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-amber-400 bg-amber-50" /> Pending</span>
        </div>
      </Card>
    </>
  );
}
