"use client";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { useQuery, useStore } from "@/lib/store";
import { emp, round } from "@/lib/engine";
import { office } from "@/data/offices";
import { fullName } from "@/data/employees";
import { APP } from "@/config/app";
import { fmtDate, fmtNum } from "@/lib/format";
import { Button, Card, CardHeader, Empty, PageHeader, Select, Table } from "@/components/ui";
import { CreditCards } from "@/components/leave";

export default function CreditsPage() {
  const { db, user } = useStore();
  const router = useRouter();
  const q = useQuery("emp");
  if (!user) return null;
  const isHR = user.role === "HRMO";
  const targetId = isHR && q ? q : user.id;
  const e = emp(db, targetId);
  if (!e) return <Card><Empty>Employee not found.</Empty></Card>;

  // Merge VL and SL entries into one leave-card row per transaction
  const entries = db.ledger.filter((l) => l.employeeId === e.id).sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
  type Row = { key: string; date: string; particulars: string; vlE: number; vlD: number; slE: number; slD: number; vlBal: number; slBal: number };
  const rows: Row[] = [];
  let vl = 0;
  let sl = 0;
  for (const l of entries) {
    const key = `${l.date}|${l.particulars}`;
    let r = rows.find((x) => x.key === key);
    if (!r) {
      r = { key, date: l.date, particulars: l.particulars, vlE: 0, vlD: 0, slE: 0, slD: 0, vlBal: 0, slBal: 0 };
      rows.push(r);
    }
    if (l.kind === "VL") {
      r.vlE += l.earned;
      r.vlD += l.deducted;
    } else {
      r.slE += l.earned;
      r.slD += l.deducted;
    }
  }
  for (const r of rows) {
    vl = round(vl + r.vlE - r.vlD);
    sl = round(sl + r.slE - r.slD);
    r.vlBal = vl;
    r.slBal = sl;
  }

  return (
    <>
      <PageHeader
        title={isHR && e.id !== user.id ? "Employee Leave Ledger" : "My Leave Credits"}
        subtitle="Electronic leave card — monthly accruals and deductions with running balances."
        action={
          <div className="no-print flex flex-wrap gap-2">
            {isHR && (
              <Select value={e.id} onChange={(ev) => router.push(`/credits?emp=${ev.target.value}`)} className="w-64">
                {db.employees
                  .filter((x) => x.status !== "Elective")
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.lastName}, {x.firstName} — {office(x.officeId)?.short}
                    </option>
                  ))}
              </Select>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} /> Print ledger
            </Button>
          </div>
        }
      />
      <div className="no-print">
        <CreditCards db={db} employeeId={e.id} />
      </div>
      <Card className="print-area mt-6">
        <CardHeader
          title={
            <span>
              Leave Ledger — {fullName(e)} <span className="font-normal text-slate-500">({e.employeeNo})</span>
            </span>
          }
          subtitle={`${e.position} · ${office(e.officeId)?.name} · ${e.status} · Original appointment ${fmtDate(e.originalAppointment)} · ${APP.agency}`}
        />
        {rows.length === 0 ? (
          <Empty>No ledger entries (elective officials do not earn leave credits).</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th rowSpan={2}>Date</th>
                <th rowSpan={2}>Particulars</th>
                <th colSpan={3} className="border-l border-slate-200 text-center">Vacation Leave</th>
                <th colSpan={3} className="border-l border-slate-200 text-center">Sick Leave</th>
              </tr>
              <tr>
                <th className="border-l border-slate-200 text-right">Earned</th>
                <th className="text-right">Availed</th>
                <th className="text-right">Balance</th>
                <th className="border-l border-slate-200 text-right">Earned</th>
                <th className="text-right">Availed</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="whitespace-nowrap text-slate-500">{fmtDate(r.date)}</td>
                  <td>{r.particulars}</td>
                  <td className="border-l border-slate-100 text-right">{r.vlE ? fmtNum(r.vlE) : ""}</td>
                  <td className="text-right text-red-600">{r.vlD ? fmtNum(r.vlD) : ""}</td>
                  <td className="text-right font-medium">{fmtNum(r.vlBal)}</td>
                  <td className="border-l border-slate-100 text-right">{r.slE ? fmtNum(r.slE) : ""}</td>
                  <td className="text-right text-red-600">{r.slD ? fmtNum(r.slD) : ""}</td>
                  <td className="text-right font-medium">{fmtNum(r.slBal)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
