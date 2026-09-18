"use client";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { credits, emp } from "@/lib/engine";
import { OFFICES, office } from "@/data/offices";
import { fullName } from "@/data/employees";
import { leaveType } from "@/data/leaveTypes";
import { APP } from "@/config/app";
import { fmtDate, fmtNum } from "@/lib/format";
import { Button, Card, CardHeader, Empty, Input, Label, PageHeader, Select, Table, cn } from "@/components/ui";

type Tab = "employee" | "office" | "period" | "balances";
const TABS: [Tab, string][] = [
  ["employee", "By employee"],
  ["office", "By office"],
  ["period", "By period"],
  ["balances", "Credit balances"],
];

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { db } = useStore();
  const year = new Date().getFullYear();
  const [tab, setTab] = useState<Tab>("employee");
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);
  const [off, setOff] = useState("");

  const approved = useMemo(
    () => db.applications.filter((a) => a.status === "APPROVED" && a.startDate >= from && a.startDate <= to && (!off || emp(db, a.employeeId)?.officeId === off)),
    [db, from, to, off],
  );
  const bucket = (a: (typeof approved)[number]) => (a.typeCode === "VL" || a.typeCode === "FL" ? "vl" : a.typeCode === "SL" ? "sl" : "other");
  const people = db.employees.filter((e) => e.status !== "Elective" && (!off || e.officeId === off));

  const byEmployee = people
    .map((e) => {
      const mine = approved.filter((a) => a.employeeId === e.id);
      const sum = (b: string) => mine.filter((a) => bucket(a) === b).reduce((s, a) => s + a.days, 0);
      return { e, n: mine.length, vl: sum("vl"), sl: sum("sl"), other: sum("other") };
    })
    .filter((r) => r.n > 0)
    .sort((a, b) => b.vl + b.sl + b.other - (a.vl + a.sl + a.other));

  const byOffice = OFFICES.filter((o) => !off || o.id === off).map((o) => {
    const list = approved.filter((a) => emp(db, a.employeeId)?.officeId === o.id);
    const sum = (b: string) => list.filter((a) => bucket(a) === b).reduce((s, a) => s + a.days, 0);
    return { o, staff: db.employees.filter((e) => e.officeId === o.id && e.active).length, n: list.length, vl: sum("vl"), sl: sum("sl"), other: sum("other") };
  });

  const months = new Map<string, { n: number; vl: number; sl: number; other: number }>();
  for (const a of approved) {
    const k = a.startDate.slice(0, 7);
    const m = months.get(k) ?? { n: 0, vl: 0, sl: 0, other: 0 };
    m.n++;
    m[bucket(a)] += a.days;
    months.set(k, m);
  }
  const byPeriod = [...months.entries()].sort();
  const maxMonth = Math.max(1, ...byPeriod.map(([, m]) => m.vl + m.sl + m.other));

  const exportCsv = () => {
    if (tab === "employee") downloadCsv("leave-by-employee.csv", [["Employee", "Office", "Applications", "VL/FL days", "SL days", "Other days"], ...byEmployee.map((r) => [fullName(r.e), office(r.e.officeId)?.short ?? "", r.n, r.vl, r.sl, r.other])]);
    if (tab === "office") downloadCsv("leave-by-office.csv", [["Office", "Personnel", "Applications", "VL/FL days", "SL days", "Other days"], ...byOffice.map((r) => [r.o.name, r.staff, r.n, r.vl, r.sl, r.other])]);
    if (tab === "period") downloadCsv("leave-by-period.csv", [["Month", "Applications", "VL/FL days", "SL days", "Other days"], ...byPeriod.map(([k, m]) => [k, m.n, m.vl, m.sl, m.other])]);
    if (tab === "balances") downloadCsv("leave-balances.csv", [["Employee", "Office", "VL balance", "SL balance"], ...people.map((e) => { const c = credits(db, e.id); return [fullName(e), office(e.officeId)?.short ?? "", c.vl, c.sl]; })]);
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Leave utilization summaries generated directly from system records."
        action={
          <div className="no-print flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={16} /> Print
            </Button>
          </div>
        }
      />
      <Card className="no-print mb-6 grid gap-3 p-4 sm:grid-cols-3">
        <label>
          <Label>From (leave start date)</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label>
          <Label>Office</Label>
          <Select value={off} onChange={(e) => setOff(e.target.value)}>
            <option value="">All offices</option>
            {OFFICES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </label>
      </Card>

      <div className="no-print mb-4 flex gap-1 overflow-x-auto rounded-lg bg-slate-200/60 p-1">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium", tab === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}>
            {label}
          </button>
        ))}
      </div>

      <Card className="print-area">
        <div className="hidden border-b border-slate-200 px-5 py-4 text-center print:block">
          <p className="text-sm">{APP.agency}</p>
          <p className="font-semibold">{APP.office}</p>
        </div>
        <CardHeader
          title={`Leave Utilization Report — ${TABS.find((t) => t[0] === tab)?.[1]}`}
          subtitle={`${fmtDate(from)} to ${fmtDate(to)} · ${off ? office(off)?.name : "All offices"} · ${approved.length} approved application(s)`}
        />
        {tab === "employee" &&
          (byEmployee.length === 0 ? (
            <Empty>No approved leave in this period.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Office</th>
                  <th className="text-right">Applications</th>
                  <th className="text-right">VL / Forced</th>
                  <th className="text-right">Sick</th>
                  <th className="text-right">Other types</th>
                  <th className="text-right">Total days</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {byEmployee.map((r) => (
                  <tr key={r.e.id}>
                    <td className="font-medium">{fullName(r.e)}</td>
                    <td>{office(r.e.officeId)?.short}</td>
                    <td className="text-right">{r.n}</td>
                    <td className="text-right">{r.vl}</td>
                    <td className="text-right">{r.sl}</td>
                    <td className="text-right">{r.other}</td>
                    <td className="text-right font-semibold">{r.vl + r.sl + r.other}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ))}
        {tab === "office" && (
          <Table>
            <thead>
              <tr>
                <th>Office</th>
                <th className="text-right">Personnel</th>
                <th className="text-right">Applications</th>
                <th className="text-right">VL / Forced</th>
                <th className="text-right">Sick</th>
                <th className="text-right">Other types</th>
                <th className="text-right">Avg days / person</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {byOffice.map((r) => (
                <tr key={r.o.id}>
                  <td className="font-medium">{r.o.name}</td>
                  <td className="text-right">{r.staff}</td>
                  <td className="text-right">{r.n}</td>
                  <td className="text-right">{r.vl}</td>
                  <td className="text-right">{r.sl}</td>
                  <td className="text-right">{r.other}</td>
                  <td className="text-right font-semibold">{r.staff ? ((r.vl + r.sl + r.other) / r.staff).toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {tab === "period" &&
          (byPeriod.length === 0 ? (
            <Empty>No approved leave in this period.</Empty>
          ) : (
            <div className="space-y-3 p-5">
              {byPeriod.map(([k, m]) => {
                const total = m.vl + m.sl + m.other;
                return (
                  <div key={k} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm">
                    <span className="text-slate-600">{new Date(k + "-01T00:00").toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</span>
                    <div className="flex h-5 overflow-hidden rounded bg-slate-100" style={{ width: `${(total / maxMonth) * 100}%`, minWidth: "4px" }}>
                      <div className="bg-brand-500" style={{ width: `${(m.vl / total) * 100}%` }} title={`VL ${m.vl}`} />
                      <div className="bg-sky-500" style={{ width: `${(m.sl / total) * 100}%` }} title={`SL ${m.sl}`} />
                      <div className="bg-amber-400" style={{ width: `${(m.other / total) * 100}%` }} title={`Other ${m.other}`} />
                    </div>
                    <span className="text-right font-semibold tabular-nums">{total} d</span>
                  </div>
                );
              })}
              <div className="flex gap-4 pt-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-500" /> VL / Forced</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-500" /> Sick</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400" /> Other types</span>
              </div>
              <p className="pt-2 text-xs text-slate-500">
                Most common types:{" "}
                {[...new Set(approved.map((a) => a.typeCode))].map((c) => `${leaveType(c).name} (${approved.filter((a) => a.typeCode === c).length})`).join(", ")}
              </p>
            </div>
          ))}
        {tab === "balances" && (
          <Table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Office</th>
                <th>Position</th>
                <th className="text-right">VL balance</th>
                <th className="text-right">SL balance</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {people.map((e) => {
                const c = credits(db, e.id);
                return (
                  <tr key={e.id}>
                    <td className="font-medium">{fullName(e)}</td>
                    <td>{office(e.officeId)?.short}</td>
                    <td>{e.position}</td>
                    <td className="text-right">{fmtNum(c.vl)}</td>
                    <td className="text-right">{fmtNum(c.sl)}</td>
                    <td className="text-right font-semibold">{fmtNum(c.vl + c.sl)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Generated {new Date().toLocaleString("en-PH")} · {APP.fullName}</p>
      </Card>
    </>
  );
}
