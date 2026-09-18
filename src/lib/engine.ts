// ─────────────────────────────────────────────────────────────
// Business rules of the leave system (pure functions, no UI).
// When the real backend is built, this logic moves to the server
// (Next.js route handlers / server actions + Prisma).
// ─────────────────────────────────────────────────────────────
import { APP, HOLIDAYS } from "@/config/app";
import { leaveType, type CreditKind } from "@/data/leaveTypes";
import { OFFICES } from "@/data/offices";
import { fullName, type Employee } from "@/data/employees";
import type {
  ActionStep,
  AppStatus,
  DbState,
  LeaveApplication,
  LeaveDetails,
} from "./types";

let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeRefNo(year: number, rand: () => number = Math.random) {
  const pick = (n: number) =>
    Array.from({ length: n }, () => REF_CHARS[Math.floor(rand() * REF_CHARS.length)]).join("");
  return `MMH-${year}-${pick(4)}-${pick(4)}`;
}

// ── dates ────────────────────────────────────────────────────
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function workingDays(start: string, end: string) {
  if (!start || !end) return 0;
  const s = parse(start);
  const e = parse(end);
  if (e < s) return 0;
  let n = 0;
  for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !HOLIDAYS[toISODate(d)]) n++;
  }
  return n;
}

export const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 <= b2 && b1 <= a2;

export const round = (n: number) => Math.round(n * 1000) / 1000;

// ── people / routing ─────────────────────────────────────────
export const emp = (db: DbState, id: string) => db.employees.find((e) => e.id === id);
export const empName = (db: DbState, id: string) => {
  const e = emp(db, id);
  return e ? fullName(e) : "Unknown";
};
export const officeHeadId = (officeId: string) => OFFICES.find((o) => o.id === officeId)?.headId;

export function actorsFor(db: DbState, app: LeaveApplication): string[] {
  const applicant = emp(db, app.employeeId);
  if (!applicant) return [];
  const active = db.employees.filter((e) => e.active);
  switch (app.status) {
    case "FOR_RECOMMENDATION": {
      const h = officeHeadId(applicant.officeId);
      return h ? [h] : [];
    }
    case "FOR_CERTIFICATION":
      return active.filter((e) => e.role === "HRMO").map((e) => e.id);
    case "FOR_APPROVAL":
      return active.filter((e) => e.role === "APPROVER").map((e) => e.id);
    default:
      return [];
  }
}

export function canAct(db: DbState, app: LeaveApplication, userId: string) {
  return actorsFor(db, app).includes(userId);
}

export const isOpen = (s: AppStatus) =>
  s === "FOR_RECOMMENDATION" || s === "FOR_CERTIFICATION" || s === "FOR_APPROVAL";

// ── credits ──────────────────────────────────────────────────
export function balance(db: DbState, employeeId: string, kind: CreditKind, asOf?: string) {
  return round(
    db.ledger
      .filter((l) => l.employeeId === employeeId && l.kind === kind && (!asOf || l.date <= asOf))
      .reduce((sum, l) => sum + l.earned - l.deducted, 0),
  );
}

export function pendingDays(db: DbState, employeeId: string, kind: CreditKind, excludeId?: string) {
  return db.applications
    .filter(
      (a) =>
        a.employeeId === employeeId &&
        a.id !== excludeId &&
        isOpen(a.status) &&
        leaveType(a.typeCode).deductsFrom === kind,
    )
    .reduce((s, a) => s + a.days, 0);
}

export function credits(db: DbState, employeeId: string) {
  const vl = balance(db, employeeId, "VL");
  const sl = balance(db, employeeId, "SL");
  const vlPending = pendingDays(db, employeeId, "VL");
  const slPending = pendingDays(db, employeeId, "SL");
  return { vl, sl, vlPending, slPending, vlAvailable: round(vl - vlPending), slAvailable: round(sl - slPending) };
}

// ── mutations (each returns a NEW state) ─────────────────────
const clone = (db: DbState): DbState => structuredClone(db);

function notify(db: DbState, userIds: string[], title: string, body: string, at: string, appId?: string) {
  for (const userId of userIds)
    db.notifications.unshift({ id: uid("N"), userId, at, title, body, appId, read: false });
}

function audit(db: DbState, byId: string, action: string, detail: string, at: string) {
  db.audit.unshift({ id: uid("A"), at, byId, action, detail });
}

export interface FileInput {
  employeeId: string;
  typeCode: string;
  details: LeaveDetails;
  startDate: string;
  endDate: string;
  commutation: "Not Requested" | "Requested";
}

export function validateFile(db: DbState, input: FileInput): string | null {
  const e = emp(db, input.employeeId);
  if (!e) return "Employee not found.";
  if (!input.startDate || !input.endDate) return "Please select the inclusive dates.";
  if (input.endDate < input.startDate) return "The end date cannot be earlier than the start date.";
  const days = workingDays(input.startDate, input.endDate);
  if (days <= 0) return "The selected dates contain no working days (weekends and holidays are excluded).";
  const t = leaveType(input.typeCode);
  if (t.detail === "vacation" && !input.details.location) return "Please indicate where the leave will be spent.";
  if (t.detail === "sick" && !input.details.sickWhere) return "Please indicate In Hospital or Out Patient.";
  if (t.detail === "sick" && !input.details.illness?.trim()) return "Please specify the illness.";
  if (t.detail === "study" && !input.details.study) return "Please select the purpose of the study leave.";
  const clash = db.applications.find(
    (a) =>
      a.employeeId === e.id &&
      (isOpen(a.status) || a.status === "APPROVED") &&
      overlaps(a.startDate, a.endDate, input.startDate, input.endDate),
  );
  if (clash) return `These dates overlap with your application ${clash.refNo} (${clash.startDate} to ${clash.endDate}).`;
  if (t.deductsFrom) {
    const c = credits(db, e.id);
    const avail = t.deductsFrom === "VL" ? c.vlAvailable : c.slAvailable;
    if (days > avail)
      return `Insufficient ${t.deductsFrom === "VL" ? "vacation" : "sick"} leave credits. You are applying for ${days} day(s) but only ${avail} day(s) are available (balance less pending applications).`;
  }
  return null;
}

export function fileLeave(db0: DbState, input: FileInput, byId: string, now = new Date(), refNo?: string) {
  const err = validateFile(db0, input);
  if (err) throw new Error(err);
  const db = clone(db0);
  const e = emp(db, input.employeeId)!;
  const at = now.toISOString();
  const selfHead = officeHeadId(e.officeId) === e.id;
  const app: LeaveApplication = {
    id: uid("L"),
    refNo: refNo ?? makeRefNo(now.getFullYear()),
    employeeId: e.id,
    typeCode: input.typeCode,
    details: input.details,
    startDate: input.startDate,
    endDate: input.endDate,
    days: workingDays(input.startDate, input.endDate),
    commutation: input.commutation,
    status: selfHead ? "FOR_CERTIFICATION" : "FOR_RECOMMENDATION",
    filedAt: at,
    actions: [{ step: "FILED", byId, at, remarks: selfHead ? "Filed by department head; routed directly to HRMO." : "" }],
  };
  db.applications.unshift(app);
  const t = leaveType(app.typeCode);
  notify(db, [e.id], "Application submitted", `Your ${t.name} (${app.days} day/s) was submitted and is now ${app.status === "FOR_RECOMMENDATION" ? "with your department head" : "with the HRMO"}.`, at, app.id);
  notify(db, actorsFor(db, app), "New leave application", `${fullName(e)} filed ${t.name} for ${app.days} day(s). Awaiting your action.`, at, app.id);
  audit(db, byId, "FILE_LEAVE", `${app.refNo} · ${t.name} · ${fullName(e)}`, at);
  return { db, app };
}

export type Decision = "APPROVE" | "DISAPPROVE";

export function actOn(db0: DbState, appId: string, byId: string, decision: Decision, remarks: string, now = new Date()) {
  const db = clone(db0);
  const app = db.applications.find((a) => a.id === appId);
  if (!app) throw new Error("Application not found.");
  if (!canAct(db, app, byId)) throw new Error("You are not the assigned officer for this step.");
  if (decision === "DISAPPROVE" && !remarks.trim()) throw new Error("Please state the reason for disapproval.");
  const at = now.toISOString();
  const applicant = emp(db, app.employeeId)!;
  const t = leaveType(app.typeCode);
  const actor = empName(db, byId);
  let step: ActionStep;
  let next: AppStatus;

  switch (app.status) {
    case "FOR_RECOMMENDATION":
      step = decision === "APPROVE" ? "RECOMMENDED" : "NOT_RECOMMENDED";
      next = decision === "APPROVE" ? "FOR_CERTIFICATION" : "DISAPPROVED";
      break;
    case "FOR_CERTIFICATION": {
      if (decision === "APPROVE") {
        const asOf = toISODate(now);
        const vlTotal = balance(db, applicant.id, "VL", asOf);
        const slTotal = balance(db, applicant.id, "SL", asOf);
        const vlLess = t.deductsFrom === "VL" ? app.days : 0;
        const slLess = t.deductsFrom === "SL" ? app.days : 0;
        if (vlLess > vlTotal || slLess > slTotal)
          throw new Error("Cannot certify: the employee's current balance is lower than the days applied for.");
        app.certification = { asOf, vlTotal, slTotal, vlLess, slLess, vlBalance: round(vlTotal - vlLess), slBalance: round(slTotal - slLess) };
      }
      step = decision === "APPROVE" ? "CERTIFIED" : "DISAPPROVED";
      next = decision === "APPROVE" ? "FOR_APPROVAL" : "DISAPPROVED";
      break;
    }
    case "FOR_APPROVAL":
      step = decision === "APPROVE" ? "APPROVED" : "DISAPPROVED";
      next = decision === "APPROVE" ? "APPROVED" : "DISAPPROVED";
      break;
    default:
      throw new Error("This application is already closed.");
  }

  app.actions.push({ step, byId, at, remarks });
  app.status = next;

  if (next === "APPROVED" && t.deductsFrom) {
    db.ledger.push({
      id: uid("G"),
      employeeId: applicant.id,
      date: toISODate(now),
      particulars: `${t.name} ${app.startDate}${app.endDate !== app.startDate ? " to " + app.endDate : ""} (${app.refNo})`,
      kind: t.deductsFrom,
      earned: 0,
      deducted: app.days,
      appId: app.id,
    });
  }

  const label: Record<ActionStep, string> = {
    FILED: "filed",
    RECOMMENDED: "recommended for approval",
    NOT_RECOMMENDED: "not recommended",
    CERTIFIED: "certified by the HRMO",
    APPROVED: "APPROVED",
    DISAPPROVED: "disapproved",
    CANCELLED: "cancelled",
  };
  notify(
    db,
    [applicant.id],
    next === "APPROVED" ? "Leave approved" : next === "DISAPPROVED" ? "Leave disapproved" : "Application update",
    `Your ${t.name} (${app.refNo}) was ${label[step]} by ${actor}.${remarks ? ` Remarks: ${remarks}` : ""}${next === "APPROVED" ? " You may now print CS Form No. 6 with its QR code." : ""}`,
    at,
    app.id,
  );
  if (isOpen(next))
    notify(db, actorsFor(db, app), "Leave application awaiting action", `${fullName(applicant)} – ${t.name} (${app.days} day/s) was ${label[step]} and now needs your action.`, at, app.id);
  audit(db, byId, step, `${app.refNo} · ${fullName(applicant)}${remarks ? " · " + remarks : ""}`, at);
  return db;
}

export function cancelApp(db0: DbState, appId: string, byId: string, now = new Date()) {
  const db = clone(db0);
  const app = db.applications.find((a) => a.id === appId);
  if (!app || app.employeeId !== byId || !isOpen(app.status)) throw new Error("Only your own pending applications can be cancelled.");
  const at = now.toISOString();
  const actors = actorsFor(db, app);
  app.status = "CANCELLED";
  app.actions.push({ step: "CANCELLED", byId, at, remarks: "Cancelled by applicant" });
  notify(db, actors, "Application cancelled", `${empName(db, byId)} cancelled ${app.refNo}.`, at, app.id);
  audit(db, byId, "CANCEL", app.refNo, at);
  return db;
}

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" });
};

export const nextMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

/** Earns credits for every active, non-elective employee for the month after lastAccrualMonth. */
export function postAccrual(db0: DbState, byId: string, now = new Date()) {
  const db = clone(db0);
  const month = nextMonth(db.lastAccrualMonth);
  const [y, m] = month.split("-").map(Number);
  const lastDay = toISODate(new Date(y, m, 0));
  const eligible = db.employees.filter((e) => e.active && e.status !== "Elective");
  for (const e of eligible) addAccrual(db, e, month, lastDay);
  db.lastAccrualMonth = month;
  const at = now.toISOString();
  notify(db, eligible.map((e) => e.id), "Leave credits posted", `${APP.monthlyAccrual} VL and ${APP.monthlyAccrual} SL credits were added for ${monthLabel(month)}.`, at);
  audit(db, byId, "POST_ACCRUAL", `${monthLabel(month)} · ${eligible.length} employees`, at);
  return { db, month, count: eligible.length };
}

export function addAccrual(db: DbState, e: Employee, month: string, date: string) {
  for (const kind of ["VL", "SL"] as const)
    db.ledger.push({ id: uid("G"), employeeId: e.id, date, particulars: `Earned – ${monthLabel(month)}`, kind, earned: APP.monthlyAccrual, deducted: 0 });
}

export function saveEmployee(db0: DbState, e: Employee, byId: string, isNew: boolean, now = new Date()) {
  const db = clone(db0);
  const at = now.toISOString();
  if (db.employees.some((x) => x.username === e.username && x.id !== e.id)) throw new Error("That username is already taken.");
  if (isNew) {
    db.employees.push(e);
    const date = toISODate(now);
    if (e.openingVL) db.ledger.push({ id: uid("G"), employeeId: e.id, date, particulars: "Balance forwarded (leave card)", kind: "VL", earned: e.openingVL, deducted: 0 });
    if (e.openingSL) db.ledger.push({ id: uid("G"), employeeId: e.id, date, particulars: "Balance forwarded (leave card)", kind: "SL", earned: e.openingSL, deducted: 0 });
    audit(db, byId, "CREATE_ACCOUNT", `${fullName(e)} (${e.username})`, at);
  } else {
    db.employees = db.employees.map((x) => (x.id === e.id ? e : x));
    audit(db, byId, "UPDATE_ACCOUNT", `${fullName(e)} (${e.username})`, at);
  }
  return db;
}

export function logAudit(db0: DbState, byId: string, action: string, detail: string) {
  const db = clone(db0);
  audit(db, byId, action, detail, new Date().toISOString());
  return db;
}
