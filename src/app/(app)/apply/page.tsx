"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, Info, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import { credits, fileLeave, officeHeadId, validateFile, workingDays, type FileInput } from "@/lib/engine";
import { LEAVE_TYPES, leaveType } from "@/data/leaveTypes";
import { office } from "@/data/offices";
import { formName } from "@/data/employees";
import { fmtNum, fmtRange } from "@/lib/format";
import { Alert, Button, Card, CardHeader, Input, Label, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { LeaveDetails } from "@/lib/types";

export default function ApplyPage() {
  const { db, user, commit } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [typeCode, setTypeCode] = useState("VL");
  const [details, setDetails] = useState<LeaveDetails>({ location: "Within the Philippines" });
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [commutation, setCommutation] = useState<FileInput["commutation"]>("Not Requested");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const t = leaveType(typeCode);
  const days = useMemo(() => workingDays(startDate, endDate), [startDate, endDate]);
  if (!user) return null;
  const c = credits(db, user.id);
  const input: FileInput = { employeeId: user.id, typeCode, details, startDate, endDate, commutation };
  const available = t.deductsFrom === "VL" ? c.vlAvailable : t.deductsFrom === "SL" ? c.slAvailable : null;
  const set = (p: Partial<LeaveDetails>) => setDetails((d) => ({ ...d, ...p }));
  const route = officeHeadId(user.officeId) === user.id ? "HRMO → Approving Authority" : "Department Head → HRMO → Approving Authority";

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateFile(db, input);
    setError(err ?? "");
    if (!err) setConfirming(true);
  };

  const submit = () => {
    try {
      const { db: next, app } = fileLeave(db, input, user.id);
      commit(next);
      toast(`Application ${app.refNo} submitted.`);
      router.push(`/application?id=${app.id}`);
    } catch (err) {
      setConfirming(false);
      setError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="File a Leave Application" subtitle="Based on Civil Service Form No. 6 (Revised 2020)" />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={review} className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="1–5. Applicant" subtitle="Taken from your employee profile" />
            <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
              <Info2 label="Office / Department" value={office(user.officeId)?.name} />
              <Info2 label="Name (Last, First, Middle)" value={formName(user)} />
              <Info2 label="Position" value={user.position} />
              <Info2 label="Date of filing" value={new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })} />
            </div>
          </Card>

          <Card>
            <CardHeader title="6.A Type of leave to be availed of" />
            <div className="space-y-4 p-5">
              <label className="block">
                <Label required>Leave type</Label>
                <Select
                  value={typeCode}
                  onChange={(e) => {
                    const nt = leaveType(e.target.value);
                    setTypeCode(nt.code);
                    setDetails(nt.detail === "vacation" ? { location: "Within the Philippines" } : {});
                  }}
                >
                  {LEAVE_TYPES.filter((x) => !(x.code === "ML" || x.code === "SLBW") || user.sex === "Female")
                    .filter((x) => x.code !== "PL" || user.sex === "Male")
                    .map((x) => (
                      <option key={x.code} value={x.code}>
                        {x.name}
                      </option>
                    ))}
                </Select>
                <p className="mt-1 text-xs text-slate-500">{t.legalBasis}</p>
              </label>
              {!t.deductsFrom && (
                <Alert tone="sky">
                  This leave type is filed, routed and QR-verified through the system but is <b>not deducted</b> from your VL/SL balance. Submit the required supporting documents to the HRMO in hard copy.
                </Alert>
              )}
            </div>
          </Card>

          {t.detail !== "none" && (
            <Card>
              <CardHeader title="6.B Details of leave" />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {t.detail === "vacation" && (
                  <>
                    <label className="block">
                      <Label required>Where will the leave be spent?</Label>
                      <Select value={details.location ?? ""} onChange={(e) => set({ location: e.target.value as LeaveDetails["location"] })}>
                        <option>Within the Philippines</option>
                        <option>Abroad</option>
                      </Select>
                    </label>
                    <label className="block">
                      <Label>Specify place</Label>
                      <Input value={details.locationSpec ?? ""} onChange={(e) => set({ locationSpec: e.target.value })} placeholder={details.location === "Abroad" ? "e.g. Singapore" : "e.g. Pagadian City"} />
                    </label>
                  </>
                )}
                {t.detail === "sick" && (
                  <>
                    <label className="block">
                      <Label required>In case of sick leave</Label>
                      <Select value={details.sickWhere ?? ""} onChange={(e) => set({ sickWhere: e.target.value as LeaveDetails["sickWhere"] })}>
                        <option value="">Select…</option>
                        <option>In Hospital</option>
                        <option>Out Patient</option>
                      </Select>
                    </label>
                    <label className="block">
                      <Label required>Specify illness</Label>
                      <Input value={details.illness ?? ""} onChange={(e) => set({ illness: e.target.value })} placeholder="e.g. Influenza" />
                    </label>
                    <p className="text-xs text-slate-500 sm:col-span-2">Sick leave of more than five (5) days, or filed in advance, requires a medical certificate submitted in hard copy to the HRMO.</p>
                  </>
                )}
                {t.detail === "women" && (
                  <label className="block sm:col-span-2">
                    <Label>Specify illness (Special Leave Benefits for Women)</Label>
                    <Input value={details.womenIllness ?? ""} onChange={(e) => set({ womenIllness: e.target.value })} />
                  </label>
                )}
                {t.detail === "study" && (
                  <label className="block sm:col-span-2">
                    <Label required>In case of study leave</Label>
                    <Select value={details.study ?? ""} onChange={(e) => set({ study: e.target.value as LeaveDetails["study"] })}>
                      <option value="">Select…</option>
                      <option>Completion of Master&apos;s Degree</option>
                      <option>BAR/Board Examination Review</option>
                    </Select>
                  </label>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="6.C–6.D Inclusive dates and commutation" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block">
                <Label required>From</Label>
                <Input type="date" value={startDate} onChange={(e) => {
                  setStart(e.target.value);
                  if (!endDate || endDate < e.target.value) setEnd(e.target.value);
                }} />
              </label>
              <label className="block">
                <Label required>To</Label>
                <Input type="date" value={endDate} min={startDate} onChange={(e) => setEnd(e.target.value)} />
              </label>
              <div className="flex items-center gap-3 rounded-lg bg-brand-50 px-4 py-3 sm:col-span-2">
                <CalendarDays className="text-brand-600" size={20} />
                <p className="text-sm text-brand-900">
                  Number of working days applied for: <b className="text-lg tabular-nums">{days}</b>
                  <span className="block text-xs text-brand-700">Weekends and declared holidays are excluded automatically.</span>
                </p>
              </div>
              <label className="block">
                <Label>Commutation</Label>
                <Select value={commutation} onChange={(e) => setCommutation(e.target.value as FileInput["commutation"])}>
                  <option>Not Requested</option>
                  <option>Requested</option>
                </Select>
              </label>
              <label className="block">
                <Label>Other remarks (optional)</Label>
                <Textarea rows={1} value={details.others ?? ""} onChange={(e) => set({ others: e.target.value })} />
              </label>
            </div>
          </Card>

          {error && <Alert>{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">
              <Send size={16} /> Review &amp; submit
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <Card className="p-5 lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-slate-800">Your leave credits</p>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Vacation leave balance" v={fmtNum(c.vl)} />
              <Row k="Pending VL applications" v={`− ${c.vlPending}`} />
              <Row k="Available VL" v={fmtNum(c.vlAvailable)} strong />
              <div className="my-2 border-t border-slate-100" />
              <Row k="Sick leave balance" v={fmtNum(c.sl)} />
              <Row k="Pending SL applications" v={`− ${c.slPending}`} />
              <Row k="Available SL" v={fmtNum(c.slAvailable)} strong />
            </dl>
            {available !== null && days > 0 && (
              <div className={`mt-4 rounded-lg px-3 py-2 text-sm ${days > available ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {days > available ? `Not enough ${t.deductsFrom} credits for ${days} day(s).` : `After approval: ${fmtNum(available - days)} ${t.deductsFrom} day(s) left.`}
              </div>
            )}
            <div className="mt-5 flex gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <Info size={16} className="shrink-0 text-slate-400" />
              <p>
                Routing: <b>{route}</b>. You will be notified in the system at every step.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Submit this application?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Go back
            </Button>
            <Button onClick={submit}>
              <Send size={16} /> Submit application
            </Button>
          </>
        }
      >
        <dl className="space-y-2 text-sm">
          <Row k="Leave type" v={t.name} />
          <Row k="Inclusive dates" v={fmtRange(startDate, endDate)} />
          <Row k="Working days" v={String(days)} />
          {details.location && <Row k="Location" v={`${details.location}${details.locationSpec ? " – " + details.locationSpec : ""}`} />}
          {details.sickWhere && <Row k="Sick leave" v={`${details.sickWhere} – ${details.illness}`} />}
          {details.study && <Row k="Study leave" v={details.study} />}
          <Row k="Commutation" v={commutation} />
          <Row k="Routing" v={route} />
        </dl>
      </Modal>
    </>
  );
}

function Info2({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`text-right tabular-nums ${strong ? "font-bold text-slate-900" : "text-slate-700"}`}>{v}</dd>
    </div>
  );
}
