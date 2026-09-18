import type { CreditKind } from "@/data/leaveTypes";
import type { Employee } from "@/data/employees";

export type AppStatus =
  | "FOR_RECOMMENDATION"
  | "FOR_CERTIFICATION"
  | "FOR_APPROVAL"
  | "APPROVED"
  | "DISAPPROVED"
  | "CANCELLED";

export const STATUS_LABEL: Record<AppStatus, string> = {
  FOR_RECOMMENDATION: "For Recommendation",
  FOR_CERTIFICATION: "For Certification",
  FOR_APPROVAL: "For Approval",
  APPROVED: "Approved",
  DISAPPROVED: "Disapproved",
  CANCELLED: "Cancelled",
};

export type ActionStep =
  | "FILED"
  | "RECOMMENDED"
  | "NOT_RECOMMENDED"
  | "CERTIFIED"
  | "APPROVED"
  | "DISAPPROVED"
  | "CANCELLED";

export interface WorkflowAction {
  step: ActionStep;
  byId: string;
  at: string; // ISO datetime
  remarks: string;
}

export interface LeaveDetails {
  location?: "Within the Philippines" | "Abroad";
  locationSpec?: string;
  sickWhere?: "In Hospital" | "Out Patient";
  illness?: string;
  womenIllness?: string;
  study?: "Completion of Master's Degree" | "BAR/Board Examination Review";
  others?: string;
}

export interface Certification {
  asOf: string;
  vlTotal: number;
  slTotal: number;
  vlLess: number;
  slLess: number;
  vlBalance: number;
  slBalance: number;
}

export interface LeaveApplication {
  id: string;
  refNo: string;
  employeeId: string;
  typeCode: string;
  details: LeaveDetails;
  startDate: string;
  endDate: string;
  days: number;
  commutation: "Not Requested" | "Requested";
  status: AppStatus;
  filedAt: string;
  actions: WorkflowAction[];
  certification?: Certification;
}

export interface LedgerEntry {
  id: string;
  employeeId: string;
  date: string;
  particulars: string;
  kind: CreditKind;
  earned: number;
  deducted: number;
  appId?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  at: string;
  title: string;
  body: string;
  appId?: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  byId: string;
  action: string;
  detail: string;
}

export interface DbState {
  version: number;
  employees: Employee[];
  applications: LeaveApplication[];
  ledger: LedgerEntry[];
  notifications: AppNotification[];
  audit: AuditEntry[];
  lastAccrualMonth: string; // YYYY-MM
}
