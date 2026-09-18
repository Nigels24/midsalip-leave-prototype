// Sidebar menu per role. Add/remove/reorder items here.
import type { Role } from "@/data/employees";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FilePlus2,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  QrCode,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: "approvals" | "notifications";
}

const ALL: Role[] = ["EMPLOYEE", "DEPT_HEAD", "HRMO", "APPROVER"];
const FILERS: Role[] = ["EMPLOYEE", "DEPT_HEAD", "HRMO"];

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  { href: "/approvals", label: "For My Action", icon: ClipboardCheck, roles: ["DEPT_HEAD", "HRMO", "APPROVER"], badge: "approvals" },
  { href: "/apply", label: "File Leave", icon: FilePlus2, roles: FILERS },
  { href: "/applications", label: "My Applications", icon: FileText, roles: FILERS },
  { href: "/credits", label: "Leave Credits", icon: Wallet, roles: FILERS },
  { href: "/records", label: "Leave Records", icon: FolderOpen, roles: ["DEPT_HEAD", "HRMO", "APPROVER"] },
  { href: "/calendar", label: "Leave Calendar", icon: CalendarDays, roles: ["DEPT_HEAD", "HRMO", "APPROVER"] },
  { href: "/employees", label: "Employees & Accounts", icon: Users, roles: ["HRMO"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["HRMO", "APPROVER"] },
  { href: "/audit", label: "Audit Trail", icon: History, roles: ["HRMO"] },
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ALL, badge: "notifications" },
  { href: "/verify", label: "Verify QR Code", icon: QrCode, roles: ALL },
];
