"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Ban, CheckCircle2, Printer, QrCode, XCircle } from "lucide-react";
import { useQuery, useStore } from "@/lib/store";
import { actOn, balance, canAct, cancelApp, credits, emp, isOpen, overlaps, toISODate } from "@/lib/engine";
import { leaveType } from "@/data/leaveTypes";
import { office } from "@/data/offices";
import { fullName } from "@/data/employees";
import { fmtDate, fmtDateTime, fmtNum, fmtRange } from "@/lib/format";
import { Alert, Button, Card, CardHeader, Empty, Label, Modal, StatusBadge, Textarea } from "@/components/ui";
import { Timeline } from "@/components/leave";
import { QR } from "@/components/QR";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm";
import type { Decision } from "@/lib/engine";

const VERB: Record<string, { yes: string; no: string; title: string }> = {
  FOR_RECOMMENDATION: { yes: "Recommend for approval", no: "Recommend disapproval", title: "Recommendation" },
  FOR_CERTIFICATION: { yes: "Certify leave credits", no: "Return / disapprove", title: "Certification of leave credits" },
  FOR_APPROVAL: { yes: "Approve", no: "Disapprove", title: "Final action" },
};

export default function ApplicationPage() {
  const id = useQuery("id");
  const { db, user, commit } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;
  const app = db.applications.find((a) => a.id === id);
  if (!app) return <Card><Empty>Application not found. <Link className="text-brand-600 underline" href="/dashboard">Back to dashboard</Link></Empty></Card>;
  const e = emp(db, app.employeeId)!;
  const allowed = app.employeeId === user.id || user.role === "HRMO" || user.role === "APPROVER" || (user.role === "DEPT_HEAD" && e.officeId === user.officeId);
  if (!allowed) return <Card><Empty>You do not have access to this application.</Empty></Card>;

  const t = leaveType(app.typeCode);
  const mayAct = canAct(db, app, user.id);
  const verb = VERB[app.status];
  const c = credits(db, e.id);
  const today = toISODate(new Date());
  const colleagues = db.applications.filter(
    (a) => a.id !== app.id && a.status === "APPROVED" && emp(db, a.employeeId)?.officeId === e.officeId && overlaps(a.startDate, a.endDate, app.startDate, app.endDate),
  );
  const d = app.details;

  const doAct = () => {
    if (!decision) return;
    try {
      commit(actOn(db, app.id, user.id, decision, remarks));
      toast(decision === "APPROVE" ? `${verb.yes} – done.` : "Application disapproved.");
      setDecision(null);
      setRemarks("");
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <Link href={user.role === "EMPLOYEE" ? "/applications" : mayAct ? "/approvals" : "/records"} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold text-brand-600">{app.refNo}</p>
          <h1 className="text-2xl font-bold text-slate-900">{t.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {fullName(e)} · {office(e.officeId)?.name} · filed {fmtDateTime(app.filedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={app.status} />
          {app.employeeId === user.id && isOpen(app.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const ok = await confirm({
                  title: "Cancel this application?",
                  message: `${t.name} · ${fmtRange(app.startDate, app.endDate)}. This cannot be undone.`,
                  tone: "danger",
                  confirmLabel: "Cancel application",
                });
                if (!ok) return;
                commit(cancelApp(db, app.id, user.id));
                toast("Application cancelled.");
              }}
            >
              <Ban size={14} /> Cancel
            </Button>
          )}
          <Link href={`/form6?id=${app.id}`}>
            <Button variant={app.status === "APPROVED" ? "primary" : "outline"} size="sm">
              <Printer size={14} /> {app.status === "APPROVED" ? "Print CS Form No. 6" : "Preview CS Form No. 6"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {mayAct && verb && (
            <Card className="border-amber-300 ring-4 ring-amber-50">
              <CardHeader title={`Your action: ${verb.title}`} subtitle="Every action is recorded with your name, the date and time, and your remarks." />
              <div className="space-y-4 p-5">
                {app.status === "FOR_CERTIFICATION" && (
                  <div className="overflow-hidden rounded-lg border border-slate-200 text-sm">
                    <div className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">7.A Certification of leave credits · as of {fmtDate(today)}</div>
                    <table className="w-full text-right [&_td]:px-4 [&_td]:py-2 [&_th]:px-4 [&_th]:py-2">
                      <thead className="text-xs text-slate-500">
                        <tr>
                          <th className="text-left" />
                          <th>Vacation Leave</th>
                          <th>Sick Leave</th>
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        <tr className="border-t border-slate-100">
                          <td className="text-left text-slate-500">Total earned</td>
                          <td>{fmtNum(balance(db, e.id, "VL", today))}</td>
                          <td>{fmtNum(balance(db, e.id, "SL", today))}</td>
                        </tr>
                        <tr className="border-t border-slate-100">
                          <td className="text-left text-slate-500">Less this application</td>
                          <td>{fmtNum(t.deductsFrom === "VL" ? app.days : 0)}</td>
                          <td>{fmtNum(t.deductsFrom === "SL" ? app.days : 0)}</td>
                        </tr>
                        <tr className="border-t border-slate-100 font-semibold">
                          <td className="text-left">Balance</td>
                          <td>{fmtNum(balance(db, e.id, "VL", today) - (t.deductsFrom === "VL" ? app.days : 0))}</td>
                          <td>{fmtNum(balance(db, e.id, "SL", today) - (t.deductsFrom === "SL" ? app.days : 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {colleagues.length > 0 && (
                  <Alert tone="amber">
                    <b>Heads up:</b> {colleagues.length} other staff from {office(e.officeId)?.short} {colleagues.length === 1 ? "is" : "are"} on approved leave during this period:{" "}
                    {colleagues.map((a) => `${fullName(emp(db, a.employeeId)!)} (${fmtRange(a.startDate, a.endDate)})`).join(", ")}.
                  </Alert>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setDecision("APPROVE")}>
                    <CheckCircle2 size={16} /> {verb.yes}
                  </Button>
                  <Button variant="danger" onClick={() => setDecision("DISAPPROVE")}>
                    <XCircle size={16} /> {verb.no}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Application details" />
            <dl className="grid gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-2">
              <Item k="Employee" v={`${fullName(e)} (${e.employeeNo})`} />
              <Item k="Position" v={`${e.position} · SG ${e.salaryGrade}`} />
              <Item k="Leave type" v={t.name} />
              <Item k="Credit charged to" v={t.deductsFrom ? (t.deductsFrom === "VL" ? "Vacation leave credits" : "Sick leave credits") : "Not charged to VL/SL (per scope)"} />
              <Item k="Inclusive dates" v={fmtRange(app.startDate, app.endDate)} />
              <Item k="Working days" v={String(app.days)} />
              {d.location && <Item k="Location" v={`${d.location}${d.locationSpec ? " – " + d.locationSpec : ""}`} />}
              {d.sickWhere && <Item k="Sick leave" v={`${d.sickWhere}${d.illness ? " – " + d.illness : ""}`} />}
              {d.womenIllness && <Item k="Illness" v={d.womenIllness} />}
              {d.study && <Item k="Study leave" v={d.study} />}
              <Item k="Commutation" v={app.commutation} />
              {d.others && <Item k="Remarks" v={d.others} />}
              <Item k="Legal basis" v={t.legalBasis} />
            </dl>
          </Card>

          {app.certification && (
            <Card>
              <CardHeader title="Certified leave credits" subtitle={`As of ${fmtDate(app.certification.asOf)}`} />
              <div className="grid grid-cols-2 gap-4 p-5 text-sm">
                <Item k="VL earned / less / balance" v={`${fmtNum(app.certification.vlTotal)} / ${fmtNum(app.certification.vlLess)} / ${fmtNum(app.certification.vlBalance)}`} />
                <Item k="SL earned / less / balance" v={`${fmtNum(app.certification.slTotal)} / ${fmtNum(app.certification.slLess)} / ${fmtNum(app.certification.slBalance)}`} />
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Routing & status" />
            <div className="p-5">
              <Timeline db={db} app={app} />
            </div>
          </Card>
          {app.status === "APPROVED" && (
            <Card className="p-5 text-center">
              <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-slate-800">
                <QrCode size={16} /> Verification QR code
              </div>
              <QR refNo={app.refNo} size={150} className="mx-auto" />
              <p className="mt-2 font-mono text-xs font-semibold">{app.refNo}</p>
              <Link href={`/verify?ref=${app.refNo}`} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
                Open verification page
              </Link>
            </Card>
          )}
          {user.role !== "EMPLOYEE" && (
            <Card className="p-5 text-sm">
              <p className="font-semibold text-slate-800">Applicant&apos;s current credits</p>
              <div className="mt-2 space-y-1 text-slate-600">
                <p>VL: <b className="tabular-nums text-slate-800">{fmtNum(c.vl)}</b> (pending {c.vlPending})</p>
                <p>SL: <b className="tabular-nums text-slate-800">{fmtNum(c.sl)}</b> (pending {c.slPending})</p>
              </div>
              {user.role === "HRMO" && (
                <Link href={`/credits?emp=${e.id}`} className="mt-3 inline-block text-xs font-medium text-brand-600 hover:underline">
                  Open leave ledger
                </Link>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={!!decision}
        onClose={() => {
          setDecision(null);
          setError("");
        }}
        title={decision === "APPROVE" ? verb?.yes ?? "" : verb?.no ?? ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button variant={decision === "APPROVE" ? "primary" : "danger"} onClick={doAct}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {fullName(e)} · {t.name} · {app.days} day(s) · {fmtRange(app.startDate, app.endDate)}
          </p>
          {decision === "APPROVE" && app.status === "FOR_APPROVAL" && t.deductsFrom && (
            <Alert tone="sky">
              {app.days} day(s) will be deducted from the employee&apos;s {t.deductsFrom} balance, and a QR code will be generated for this application.
            </Alert>
          )}
          <label className="block">
            <Label required={decision === "DISAPPROVE"}>{decision === "DISAPPROVE" ? "Reason for disapproval" : "Remarks (optional)"}</Label>
            <Textarea rows={3} value={remarks} onChange={(ev) => setRemarks(ev.target.value)} autoFocus />
          </label>
          {error && <Alert>{error}</Alert>}
        </div>
      </Modal>
    </>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{v}</dd>
    </div>
  );
}
