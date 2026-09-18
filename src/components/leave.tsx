"use client";
// Leave-specific building blocks reused across screens.
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Circle, Search, X } from "lucide-react";
import { leaveType, LEAVE_TYPES } from "@/data/leaveTypes";
import { OFFICES, office } from "@/data/offices";
import { fullName } from "@/data/employees";
import { credits, emp, empName } from "@/lib/engine";
import { fmtDate, fmtDateTime, fmtNum, fmtRange } from "@/lib/format";
import type { AppStatus, DbState, LeaveApplication, WorkflowAction } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { Card, Empty, Input, Select, StatusBadge, Table, cn } from "./ui";

export function CreditCards({ db, employeeId }: { db: DbState; employeeId: string }) {
  const c = credits(db, employeeId);
  const rows = [
    { label: "Vacation Leave", bal: c.vl, pend: c.vlPending, avail: c.vlAvailable, color: "bg-brand-500" },
    { label: "Sick Leave", bal: c.sl, pend: c.slPending, avail: c.slAvailable, color: "bg-sky-500" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((r) => (
        <Card key={r.label} className="p-5">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", r.color)} />
            <p className="text-sm font-medium text-slate-600">{r.label}</p>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {fmtNum(r.bal)} <span className="text-base font-medium text-slate-500">days</span>
          </p>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span>
              Pending: <b className="text-slate-700">{r.pend}</b>
            </span>
            <span>
              Available to file: <b className="text-slate-700">{fmtNum(r.avail)}</b>
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

const STEPS = [
  { key: "FILED", label: "Filed by applicant" },
  { key: "REC", label: "Recommendation (Dept. Head)" },
  { key: "CERT", label: "Certification of credits (HRMO)" },
  { key: "FINAL", label: "Final action (Approving Authority)" },
];

export function Timeline({ db, app }: { db: DbState; app: LeaveApplication }) {
  const find = (steps: string[]) => app.actions.find((a) => steps.includes(a.step));
  const done: (WorkflowAction | undefined)[] = [find(["FILED"]), undefined, undefined, undefined];
  const skippedRec = !!app.actions[0]?.remarks.includes("routed directly");
  let stage = skippedRec ? 2 : 1;
  for (const act of app.actions) {
    if (act.step === "FILED" || act.step === "CANCELLED") continue;
    if (stage <= 3) done[stage++] = act;
  }
  const cancelled = find(["CANCELLED"]);
  const stageOf: Record<string, number> = { FOR_RECOMMENDATION: 1, FOR_CERTIFICATION: 2, FOR_APPROVAL: 3 };
  const currentIdx = stageOf[app.status] ?? -1;

  return (
    <ol className="relative space-y-5">
      {STEPS.map((s, i) => {
        const a = done[i];
        const negative = a && (a.step === "NOT_RECOMMENDED" || a.step === "DISAPPROVED");
        const current = i === currentIdx;
        return (
          <li key={s.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2",
                  a && !negative && "border-emerald-500 bg-emerald-500 text-white",
                  negative && "border-red-500 bg-red-500 text-white",
                  current && "border-amber-500 bg-amber-50 text-amber-600",
                  !a && !current && "border-slate-200 bg-white text-slate-300",
                )}
              >
                {a && !negative ? <Check size={14} /> : negative ? <X size={14} /> : <Circle size={8} fill="currentColor" />}
              </span>
              {i < STEPS.length - 1 && <span className={cn("mt-1 w-0.5 flex-1", a ? "bg-emerald-200" : "bg-slate-200")} />}
            </div>
            <div className="pb-1">
              <p className={cn("text-sm font-medium", a || current ? "text-slate-800" : "text-slate-400")}>{s.label}</p>
              {a && (
                <p className="text-xs text-slate-500">
                  {a.step.replace("_", " ").toLowerCase()} by {empName(db, a.byId)} · {fmtDateTime(a.at)}
                </p>
              )}
              {a?.remarks && <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">“{a.remarks}”</p>}
              {current && <p className="text-xs text-amber-600">Waiting for action</p>}
              {i === 1 && skippedRec && <p className="text-xs text-slate-500">Not required — applicant is the head of office</p>}
            </div>
          </li>
        );
      })}
      {cancelled && <li className="text-sm text-slate-500">Cancelled by applicant · {fmtDateTime(cancelled.at)}</li>}
    </ol>
  );
}

export function ApplicationsTable({
  db,
  apps,
  showEmployee = true,
  filters = true,
  empty = "No applications found.",
}: {
  db: DbState;
  apps: LeaveApplication[];
  showEmployee?: boolean;
  filters?: boolean;
  empty?: string;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | AppStatus>("");
  const [type, setType] = useState("");
  const [off, setOff] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apps.filter((a) => {
      const e = emp(db, a.employeeId);
      if (status && a.status !== status) return false;
      if (type && a.typeCode !== type) return false;
      if (off && e?.officeId !== off) return false;
      if (needle && !`${a.refNo} ${e ? fullName(e) : ""} ${leaveType(a.typeCode).name}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [apps, db, q, status, type, off]);

  return (
    <Card>
      {filters && (
        <div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search name, reference no…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AppStatus | "")}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All leave types</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </Select>
          {showEmployee ? (
            <Select value={off} onChange={(e) => setOff(e.target.value)}>
              <option value="">All offices</option>
              {OFFICES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          ) : (
            <div />
          )}
        </div>
      )}
      {rows.length === 0 ? (
        <Empty>{empty}</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Reference No.</th>
              {showEmployee && <th>Employee</th>}
              <th>Leave Type</th>
              <th>Inclusive Dates</th>
              <th className="text-right">Days</th>
              <th>Filed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const e = emp(db, a.employeeId);
              return (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/application?id=${a.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                      {a.refNo}
                    </Link>
                  </td>
                  {showEmployee && (
                    <td>
                      <p className="font-medium text-slate-800">{e ? fullName(e) : "—"}</p>
                      <p className="text-xs text-slate-500">{e && office(e.officeId)?.short}</p>
                    </td>
                  )}
                  <td>{leaveType(a.typeCode).name}</td>
                  <td className="whitespace-nowrap">{fmtRange(a.startDate, a.endDate)}</td>
                  <td className="text-right tabular-nums">{a.days}</td>
                  <td className="whitespace-nowrap text-slate-500">{fmtDate(a.filedAt)}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        Showing {rows.length} of {apps.length}
      </p>
    </Card>
  );
}
