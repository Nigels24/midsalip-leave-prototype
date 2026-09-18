"use client";
// Printable CS Form No. 6 (Revised 2020), populated from system data, with verification QR.
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useQuery, useStore } from "@/lib/store";
import { emp, officeHeadId } from "@/lib/engine";
import { LEAVE_TYPES, leaveType } from "@/data/leaveTypes";
import { office } from "@/data/offices";
import { formName, fullName } from "@/data/employees";
import { APP } from "@/config/app";
import { fmtDate, fmtNum, fmtRange, peso } from "@/lib/format";
import { Button, Card, Empty } from "@/components/ui";
import { QR, verifyUrl } from "@/components/QR";

const Box = ({ on }: { on?: boolean }) => (
  <span className="mr-1.5 inline-flex h-3 w-3 shrink-0 translate-y-[1px] items-center justify-center border border-black text-[9px] leading-none">{on ? "✔" : ""}</span>
);
const Line = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <span className={`inline-block min-w-24 border-b border-black px-1 font-sans text-[11px] font-semibold ${className}`}>{children ?? " "}</span>
);
const Sig = ({ name, title, signed }: { name: string; title: string; signed?: string }) => (
  <div className="mt-6 text-center">
    {signed && <p className="font-sans text-[9px] italic text-emerald-700">Electronically signed {signed}</p>}
    <p className="border-b border-black font-sans text-[11px] font-bold uppercase">{name}</p>
    <p className="text-[10px]">{title}</p>
  </div>
);

export default function Form6Page() {
  const id = useQuery("id");
  const { db, user } = useStore();
  if (!user) return null;
  const app = db.applications.find((a) => a.id === id);
  if (!app) return <Card><Empty>Application not found.</Empty></Card>;
  const e = emp(db, app.employeeId)!;
  const t = leaveType(app.typeCode);
  const d = app.details;
  const approved = app.status === "APPROVED";
  const act = (step: string) => app.actions.find((a) => a.step === step);
  const rec = act("RECOMMENDED") ?? act("NOT_RECOMMENDED");
  const cert = act("CERTIFIED");
  const fin = act("APPROVED");
  const dis = app.actions.find((a) => a.step === "DISAPPROVED" || a.step === "NOT_RECOMMENDED");
  const head = emp(db, officeHeadId(e.officeId) ?? "");
  const hrmo = db.employees.find((x) => x.role === "HRMO");
  const mayor = db.employees.find((x) => x.role === "APPROVER");
  const c = app.certification;
  const signedAt = (s?: { at: string }) => (s ? fmtDate(s.at) : undefined);

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/application?id=${app.id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back to application
        </Link>
        <div className="flex items-center gap-3">
          {!approved && <span className="text-sm text-amber-700">Preview only — the QR code is issued once approved.</span>}
          <Button onClick={() => window.print()}>
            <Printer size={16} /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="print-area relative mx-auto max-w-[210mm] overflow-hidden border border-slate-300 bg-white p-6 font-serif text-[11px] leading-snug text-black shadow-sm sm:p-8">
        {!approved && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-30 select-none text-6xl font-black tracking-widest text-slate-200/80">{app.status === "DISAPPROVED" ? "DISAPPROVED" : "NOT YET APPROVED"}</span>
          </div>
        )}
        <div className="relative flex items-start justify-between">
          <div className="text-[10px] italic">
            <p className="font-bold not-italic">Civil Service Form No. 6</p>
            <p>Revised 2020</p>
          </div>
          <div className="text-center">
            {approved ? <QR refNo={app.refNo} size={84} /> : <div className="flex h-[84px] w-[84px] items-center justify-center border border-dashed border-slate-400 text-[9px] text-slate-500">QR on approval</div>}
            <p className="mt-0.5 font-mono text-[9px] font-bold">{app.refNo}</p>
          </div>
        </div>
        <div className="relative -mt-12 text-center">
          <p className="text-[11px]">Republic of the Philippines</p>
          <p className="text-[12px] font-bold">{APP.agency.toUpperCase()}</p>
          <p className="text-[11px]">{APP.province}</p>
          <h1 className="mt-4 text-lg font-bold tracking-wide">APPLICATION FOR LEAVE</h1>
        </div>

        <div className="relative mt-4 border border-black">
          <div className="grid grid-cols-[1fr_2fr] border-b border-black">
            <div className="border-r border-black p-1.5">
              1. OFFICE/DEPARTMENT
              <p className="font-sans font-semibold">{office(e.officeId)?.name}</p>
            </div>
            <div className="p-1.5">
              2. NAME : <span className="text-[9px]">(Last) (First) (Middle)</span>
              <p className="font-sans font-semibold">{formName(e)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-b-4 border-double border-black p-1.5">
            <span>3. DATE OF FILING <Line>{fmtDate(app.filedAt)}</Line></span>
            <span>4. POSITION <Line>{e.position}</Line></span>
            <span>5. SALARY <Line>{peso(e.monthlySalary)}</Line></span>
          </div>

          <p className="border-b border-black bg-slate-100 py-0.5 text-center font-bold">6. DETAILS OF APPLICATION</p>
          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-1.5">
              <p className="mb-1">6.A TYPE OF LEAVE TO BE AVAILED OF</p>
              {LEAVE_TYPES.map((x) => (
                <p key={x.code} className="flex text-[10px]">
                  <Box on={x.code === t.code} />
                  <span>
                    <b>{x.name}</b> <span className="text-[8.5px]">({x.legalBasis})</span>
                  </span>
                </p>
              ))}
              <p className="mt-1 text-[10px]">
                Others: <Line className="min-w-32" />
              </p>
            </div>
            <div className="p-1.5 text-[10px]">
              <p className="mb-1 text-[11px]">6.B DETAILS OF LEAVE</p>
              <p className="italic">In case of Vacation/Special Privilege Leave:</p>
              <p className="flex"><Box on={d.location === "Within the Philippines"} /> Within the Philippines <Line className="ml-1 min-w-20">{d.location === "Within the Philippines" ? d.locationSpec : ""}</Line></p>
              <p className="flex"><Box on={d.location === "Abroad"} /> Abroad (Specify) <Line className="ml-1 min-w-20">{d.location === "Abroad" ? d.locationSpec : ""}</Line></p>
              <p className="mt-1 italic">In case of Sick Leave:</p>
              <p className="flex"><Box on={d.sickWhere === "In Hospital"} /> In Hospital (Specify Illness) <Line className="ml-1 min-w-16">{d.sickWhere === "In Hospital" ? d.illness : ""}</Line></p>
              <p className="flex"><Box on={d.sickWhere === "Out Patient"} /> Out Patient (Specify Illness) <Line className="ml-1 min-w-16">{d.sickWhere === "Out Patient" ? d.illness : ""}</Line></p>
              <p className="mt-1 italic">In case of Special Leave Benefits for Women:</p>
              <p>(Specify Illness) <Line className="min-w-32">{d.womenIllness}</Line></p>
              <p className="mt-1 italic">In case of Study Leave:</p>
              <p className="flex"><Box on={d.study === "Completion of Master's Degree"} /> Completion of Master&apos;s Degree</p>
              <p className="flex"><Box on={d.study === "BAR/Board Examination Review"} /> BAR/Board Examination Review</p>
              <p className="mt-1 italic">Other purpose:</p>
              <p className="flex"><Box /> Monetization of Leave Credits</p>
              <p className="flex"><Box /> Terminal Leave</p>
            </div>
          </div>
          <div className="grid grid-cols-2 border-b-4 border-double border-black">
            <div className="border-r border-black p-1.5">
              <p>6.C NUMBER OF WORKING DAYS APPLIED FOR</p>
              <Line className="ml-4 mt-1">{app.days} day(s)</Line>
              <p className="ml-4 mt-2">INCLUSIVE DATES</p>
              <Line className="ml-4 mt-1">{fmtRange(app.startDate, app.endDate)}</Line>
            </div>
            <div className="p-1.5">
              <p>6.D COMMUTATION</p>
              <p className="flex"><Box on={app.commutation === "Not Requested"} /> Not Requested</p>
              <p className="flex"><Box on={app.commutation === "Requested"} /> Requested</p>
              <Sig name={fullName(e)} title="(Signature of Applicant)" signed={signedAt(app.actions[0])} />
            </div>
          </div>

          <p className="border-b border-black bg-slate-100 py-0.5 text-center font-bold">7. DETAILS OF ACTION ON APPLICATION</p>
          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-1.5">
              <p>7.A CERTIFICATION OF LEAVE CREDITS</p>
              <p className="text-center">As of <Line>{c ? fmtDate(c.asOf) : ""}</Line></p>
              <table className="mt-1 w-full border border-black text-center text-[10px] [&_td]:border [&_td]:border-black [&_td]:px-1 [&_th]:border [&_th]:border-black">
                <thead>
                  <tr>
                    <th />
                    <th>Vacation Leave</th>
                    <th>Sick Leave</th>
                  </tr>
                </thead>
                <tbody className="font-sans">
                  <tr><td className="text-left font-serif italic">Total Earned</td><td>{c ? fmtNum(c.vlTotal) : ""}</td><td>{c ? fmtNum(c.slTotal) : ""}</td></tr>
                  <tr><td className="text-left font-serif italic">Less this application</td><td>{c ? fmtNum(c.vlLess) : ""}</td><td>{c ? fmtNum(c.slLess) : ""}</td></tr>
                  <tr><td className="text-left font-serif italic">Balance</td><td className="font-bold">{c ? fmtNum(c.vlBalance) : ""}</td><td className="font-bold">{c ? fmtNum(c.slBalance) : ""}</td></tr>
                </tbody>
              </table>
              <Sig name={hrmo ? fullName(hrmo) : ""} title="(Authorized Officer – HRMO)" signed={signedAt(cert)} />
            </div>
            <div className="p-1.5">
              <p>7.B RECOMMENDATION</p>
              <p className="flex"><Box on={rec?.step === "RECOMMENDED"} /> For approval</p>
              <p className="flex"><Box on={rec?.step === "NOT_RECOMMENDED"} /> For disapproval due to <Line className="ml-1 min-w-20">{rec?.step === "NOT_RECOMMENDED" ? rec.remarks : ""}</Line></p>
              <Sig name={head && head.id !== e.id ? fullName(head) : "—"} title="(Authorized Officer – Department Head)" signed={head && head.id !== e.id ? signedAt(rec) : undefined} />
            </div>
          </div>
          <div className="grid grid-cols-2 p-1.5">
            <div>
              <p>7.C APPROVED FOR:</p>
              <p className="ml-3"><Line className="min-w-12 text-center">{fin ? app.days : ""}</Line> days with pay</p>
              <p className="ml-3"><Line className="min-w-12 text-center">{fin ? 0 : ""}</Line> days without pay</p>
              <p className="ml-3"><Line className="min-w-12" /> others (Specify)</p>
            </div>
            <div>
              <p>7.D DISAPPROVED DUE TO:</p>
              <Line className="mt-1 w-full">{dis && app.status === "DISAPPROVED" ? dis.remarks : ""}</Line>
            </div>
            <div className="col-span-2 mx-auto w-72">
              <Sig name={mayor ? fullName(mayor) : ""} title="(Authorized Official – Municipal Mayor)" signed={signedAt(fin ?? (app.status === "DISAPPROVED" ? dis : undefined))} />
            </div>
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-4 font-sans text-[9px] text-slate-600">
          <p>
            Generated by the {APP.fullName}. To verify authenticity, scan the QR code or enter reference no. <b className="font-mono">{app.refNo}</b> at {verifyUrl("").replace("?ref=", "")}.
          </p>
          <p className="whitespace-nowrap">Printed {new Date().toLocaleString("en-PH")}</p>
        </div>
      </div>
    </>
  );
}
