// Builds the SAMPLE database the prototype starts with.
// Every sample application goes through the real workflow rules in lib/engine.ts,
// so balances, notifications and the audit trail are all consistent.
// To change the sample transactions, edit the SAMPLE_APPS list below.
import { EMPLOYEES, OPENING_DATE } from "./employees";
import { actOn, addAccrual, fileLeave, makeRefNo, uid, type Decision, type FileInput } from "@/lib/engine";
import type { DbState } from "@/lib/types";

export const DB_VERSION = 1;

// Monthly credits already posted for these months (YYYY-MM)
const POSTED_MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

type Step = [actorId: string, decision: Decision, remarks: string, at: string];

interface SampleApp {
  filedAt: string;
  input: FileInput;
  steps: Step[];
}

const f = (
  employeeId: string,
  typeCode: string,
  startDate: string,
  endDate: string,
  details: FileInput["details"] = {},
): FileInput => ({ employeeId, typeCode, startDate, endDate, details, commutation: "Not Requested" });

const PH = { location: "Within the Philippines" as const, locationSpec: "Pagadian City" };

const SAMPLE_APPS: SampleApp[] = [
  // Approved
  { filedAt: "2026-03-05T09:12", input: f("E009", "VL", "2026-03-16", "2026-03-17", PH), steps: [["E003", "APPROVE", "", "2026-03-05T14:00"], ["E002", "APPROVE", "", "2026-03-06T09:30"], ["E001", "APPROVE", "", "2026-03-06T15:10"]] },
  { filedAt: "2026-06-10T08:05", input: f("E013", "SL", "2026-06-08", "2026-06-09", { sickWhere: "Out Patient", illness: "Acute gastroenteritis" }), steps: [["E007", "APPROVE", "", "2026-06-10T10:00"], ["E002", "APPROVE", "", "2026-06-10T13:45"], ["E001", "APPROVE", "", "2026-06-11T08:30"]] },
  { filedAt: "2026-07-06T10:20", input: f("E011", "VL", "2026-07-20", "2026-07-24", { location: "Within the Philippines", locationSpec: "Cebu City" }), steps: [["E005", "APPROVE", "No conflicting field inspections.", "2026-07-06T15:00"], ["E002", "APPROVE", "", "2026-07-07T09:00"], ["E001", "APPROVE", "", "2026-07-08T11:20"]] },
  { filedAt: "2026-08-03T08:40", input: f("E008", "SPL", "2026-08-13", "2026-08-14", { location: "Within the Philippines", locationSpec: "Dipolog City" }), steps: [["E002", "APPROVE", "", "2026-08-03T09:10"], ["E002", "APPROVE", "", "2026-08-03T09:12"], ["E001", "APPROVE", "", "2026-08-04T14:00"]] },
  { filedAt: "2026-08-04T08:15", input: f("E012", "SL", "2026-08-03", "2026-08-03", { sickWhere: "Out Patient", illness: "Fever" }), steps: [["E006", "APPROVE", "", "2026-08-04T09:00"], ["E002", "APPROVE", "", "2026-08-04T11:00"], ["E001", "APPROVE", "", "2026-08-05T10:15"]] },
  { filedAt: "2026-09-02T13:30", input: f("E015", "VL", "2026-09-21", "2026-09-22", { location: "Within the Philippines", locationSpec: "Ozamiz City" }), steps: [["E001", "APPROVE", "", "2026-09-03T08:00"], ["E002", "APPROVE", "", "2026-09-03T10:30"], ["E001", "APPROVE", "", "2026-09-04T09:00"]] },
  { filedAt: "2026-09-08T09:00", input: f("E005", "VL", "2026-09-28", "2026-09-30", { location: "Within the Philippines", locationSpec: "Zamboanga City" }), steps: [["E002", "APPROVE", "", "2026-09-08T14:00"], ["E001", "APPROVE", "", "2026-09-09T08:45"]] },
  // Disapproved at recommendation
  { filedAt: "2026-09-01T08:30", input: f("E016", "VL", "2026-09-07", "2026-09-11", PH), steps: [["E005", "DISAPPROVE", "Barangay road project deadline; all field personnel needed.", "2026-09-01T11:00"]] },
  // Pending — For Recommendation
  { filedAt: "2026-09-14T08:20", input: f("E010", "VL", "2026-09-24", "2026-09-25", { location: "Within the Philippines", locationSpec: "Molave, Zamboanga del Sur" }), steps: [] },
  { filedAt: "2026-09-16T07:55", input: f("E014", "SL", "2026-09-14", "2026-09-15", { sickWhere: "In Hospital", illness: "Dengue fever (confined)" }), steps: [] },
  { filedAt: "2026-09-15T15:10", input: f("E011", "PL", "2026-10-01", "2026-10-07"), steps: [] },
  // Pending — For Certification
  { filedAt: "2026-09-15T08:00", input: f("E009", "SL", "2026-09-17", "2026-09-17", { sickWhere: "Out Patient", illness: "Dental procedure" }), steps: [["E003", "APPROVE", "", "2026-09-15T10:00"]] },
  { filedAt: "2026-09-15T13:00", input: f("E003", "VL", "2026-10-19", "2026-10-20", { location: "Within the Philippines", locationSpec: "Davao City" }), steps: [] },
  // Pending — For Approval
  { filedAt: "2026-09-10T09:45", input: f("E012", "VL", "2026-10-12", "2026-10-16", { location: "Within the Philippines", locationSpec: "Manila" }), steps: [["E006", "APPROVE", "", "2026-09-10T13:00"], ["E002", "APPROVE", "", "2026-09-11T09:20"]] },
];

export function buildSeed(): DbState {
  let db: DbState = {
    version: DB_VERSION,
    employees: structuredClone(EMPLOYEES),
    applications: [],
    ledger: [],
    notifications: [],
    audit: [],
    lastAccrualMonth: POSTED_MONTHS[POSTED_MONTHS.length - 1],
  };

  for (const e of db.employees) {
    if (e.status === "Elective") continue;
    for (const kind of ["VL", "SL"] as const)
      db.ledger.push({
        id: uid("G"),
        employeeId: e.id,
        date: OPENING_DATE,
        particulars: "Balance forwarded (leave card)",
        kind,
        earned: kind === "VL" ? e.openingVL : e.openingSL,
        deducted: 0,
      });
    for (const m of POSTED_MONTHS) {
      const [y, mo] = m.split("-").map(Number);
      const last = new Date(y, mo, 0);
      addAccrual(db, e, m, `${y}-${String(mo).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`);
    }
  }

  // Fixed random sequence so sample reference numbers are identical on every device
  let seed = 20261116;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const ordered = [...SAMPLE_APPS].sort((a, b) => a.filedAt.localeCompare(b.filedAt));
  for (const s of ordered) {
    const res = fileLeave(db, s.input, s.input.employeeId, new Date(s.filedAt), makeRefNo(2026, rand));
    db = res.db;
    for (const [actor, decision, remarks, at] of s.steps) db = actOn(db, res.app.id, actor, decision, remarks, new Date(at));
  }

  db.applications.sort((a, b) => b.filedAt.localeCompare(a.filedAt));
  db.notifications.sort((a, b) => b.at.localeCompare(a.at));
  db.audit.sort((a, b) => b.at.localeCompare(a.at));
  for (const n of db.notifications) n.read = n.at < "2026-09-10";
  return db;
}
