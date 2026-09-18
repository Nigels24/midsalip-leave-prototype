"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Clock, Search, ShieldCheck, XCircle } from "lucide-react";
import { useQuery, useStore } from "@/lib/store";
import { emp, isOpen } from "@/lib/engine";
import { leaveType } from "@/data/leaveTypes";
import { office } from "@/data/offices";
import { fullName } from "@/data/employees";
import { APP } from "@/config/app";
import { fmtDateTime, fmtRange } from "@/lib/format";
import { Button, Card, Input } from "@/components/ui";
import { Seal } from "@/components/Seal";

function VerifyInner() {
  const refParam = useQuery("ref");
  const { db, ready, user } = useStore();
  const [ref, setRef] = useState("");
  const [checked, setChecked] = useState<string | null>(null);

  useEffect(() => {
    if (refParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from ?ref= scanned via QR
      setRef(refParam);
      setChecked(refParam);
    }
  }, [refParam]);

  const app = checked ? db.applications.find((a) => a.refNo.toUpperCase() === checked.trim().toUpperCase()) : undefined;
  const e = app ? emp(db, app.employeeId) : undefined;
  const approvedAt = app?.actions.find((a) => a.step === "APPROVED");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setChecked(ref);
    window.history.replaceState(null, "", `?ref=${encodeURIComponent(ref.trim())}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 to-brand-700 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3 text-white">
          <Seal className="h-12 w-12" />
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-100/80">{APP.agency}</p>
            <h1 className="text-xl font-bold">Leave Document Verification</h1>
          </div>
        </div>

        <Card className="p-5">
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Reference number (printed under the QR code)</label>
            <div className="flex gap-2">
              <Input value={ref} onChange={(ev) => setRef(ev.target.value.toUpperCase())} placeholder="MMH-2026-XXXX-XXXX" className="font-mono" required />
              <Button type="submit">
                <Search size={16} /> Verify
              </Button>
            </div>
            <p className="flex items-start gap-2 text-xs text-slate-500">
              <Camera size={14} className="mt-0.5 shrink-0" /> Or scan the QR code on the printed CS Form No. 6 with any phone camera — it opens this page automatically.
            </p>
          </form>
        </Card>

        {checked && ready && (
          <Card className="mt-5 overflow-hidden">
            {!app || !e ? (
              <div className="p-6 text-center">
                <XCircle className="mx-auto text-red-500" size={48} />
                <p className="mt-3 text-lg font-bold text-red-700">No record found</p>
                <p className="mt-1 text-sm text-slate-600">
                  Reference no. <b className="font-mono">{checked}</b> does not exist in the system. The document was <b>not</b> approved through the {APP.fullName} and should be treated as invalid.
                </p>
              </div>
            ) : (
              <>
                <div
                  className={
                    app.status === "APPROVED"
                      ? "bg-emerald-600 p-5 text-white"
                      : isOpen(app.status)
                        ? "bg-amber-500 p-5 text-white"
                        : "bg-red-600 p-5 text-white"
                  }
                >
                  <div className="flex items-center gap-3">
                    {app.status === "APPROVED" ? <ShieldCheck size={40} /> : isOpen(app.status) ? <Clock size={40} /> : <AlertTriangle size={40} />}
                    <div>
                      <p className="text-lg font-bold">
                        {app.status === "APPROVED" ? "AUTHENTIC — APPROVED LEAVE" : isOpen(app.status) ? "RECORD FOUND — NOT YET APPROVED" : `RECORD FOUND — ${app.status}`}
                      </p>
                      <p className="text-sm opacity-90">
                        {app.status === "APPROVED" ? `Approved ${approvedAt ? fmtDateTime(approvedAt.at) : ""}` : "This application has no final approval. Do not honor it as an approved leave."}
                      </p>
                    </div>
                  </div>
                </div>
                <dl className="divide-y divide-slate-100 text-sm">
                  {[
                    ["Reference no.", <span key="r" className="font-mono">{app.refNo}</span>],
                    ["Name of applicant", fullName(e)],
                    ["Office", office(e.officeId)?.name],
                    ["Type of leave", leaveType(app.typeCode).name],
                    ["Inclusive dates", fmtRange(app.startDate, app.endDate)],
                    ["Working days", app.days],
                    ["Status", app.status.replaceAll("_", " ")],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between gap-4 px-5 py-3">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-right font-semibold text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                {app.status === "APPROVED" && (
                  <p className="flex items-start gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    Compare these details with the printed form. Any difference means the printed document was altered after approval.
                  </p>
                )}
              </>
            )}
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link href={user ? "/dashboard" : "/login"} className="inline-flex items-center gap-1 text-sm text-brand-100 hover:text-white">
            <ArrowLeft size={14} /> {user ? "Back to dashboard" : "Go to sign in"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
