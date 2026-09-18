// Leave types from CS Form No. 6 (Revised 2020).
// deductsFrom: "VL" or "SL" = deducted from that running balance on approval.
//              null        = filed, routed, printed and QR-verified only (no balance deduction),
//                            per the Scope and Limitations of the study.
// detail: which "Details of Leave" (6.B) fields the form asks for.

export type CreditKind = "VL" | "SL";
export type DetailKind = "vacation" | "sick" | "women" | "study" | "none";

export interface LeaveType {
  code: string;
  name: string;
  legalBasis: string;
  deductsFrom: CreditKind | null;
  detail: DetailKind;
}

export const LEAVE_TYPES: LeaveType[] = [
  { code: "VL", name: "Vacation Leave", legalBasis: "Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292", deductsFrom: "VL", detail: "vacation" },
  { code: "FL", name: "Mandatory/Forced Leave", legalBasis: "Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292", deductsFrom: "VL", detail: "none" },
  { code: "SL", name: "Sick Leave", legalBasis: "Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292", deductsFrom: "SL", detail: "sick" },
  { code: "ML", name: "Maternity Leave", legalBasis: "R.A. No. 11210 / IRR issued by CSC, DOLE and SSS", deductsFrom: null, detail: "none" },
  { code: "PL", name: "Paternity Leave", legalBasis: "R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended", deductsFrom: null, detail: "none" },
  { code: "SPL", name: "Special Privilege Leave", legalBasis: "Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292", deductsFrom: null, detail: "vacation" },
  { code: "SOLO", name: "Solo Parent Leave", legalBasis: "R.A. No. 11861 / CSC MC No. 8, s. 2004", deductsFrom: null, detail: "none" },
  { code: "STL", name: "Study Leave", legalBasis: "Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292", deductsFrom: null, detail: "study" },
  { code: "VAWC", name: "10-Day VAWC Leave", legalBasis: "R.A. No. 9262 / CSC MC No. 15, s. 2005", deductsFrom: null, detail: "none" },
  { code: "RP", name: "Rehabilitation Privilege", legalBasis: "Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292", deductsFrom: null, detail: "none" },
  { code: "SLBW", name: "Special Leave Benefits for Women", legalBasis: "R.A. No. 9710 / CSC MC No. 25, s. 2010", deductsFrom: null, detail: "women" },
  { code: "SEL", name: "Special Emergency (Calamity) Leave", legalBasis: "CSC MC No. 2, s. 2012, as amended", deductsFrom: null, detail: "none" },
  { code: "AL", name: "Adoption Leave", legalBasis: "R.A. No. 8552", deductsFrom: null, detail: "none" },
];

export const leaveType = (code: string) =>
  LEAVE_TYPES.find((t) => t.code === code) ?? LEAVE_TYPES[0];
