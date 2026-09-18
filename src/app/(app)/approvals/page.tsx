"use client";
import { useStore } from "@/lib/store";
import { canAct } from "@/lib/engine";
import { ROLE_LABEL } from "@/data/employees";
import { PageHeader } from "@/components/ui";
import { ApplicationsTable } from "@/components/leave";

const STEP_TEXT = {
  DEPT_HEAD: "Applications from your office waiting for your recommendation.",
  HRMO: "Applications waiting for certification of leave credits.",
  APPROVER: "Applications recommended and certified, waiting for final approval.",
  EMPLOYEE: "",
};

export default function ApprovalsPage() {
  const { db, user } = useStore();
  if (!user) return null;
  const queue = db.applications.filter((a) => canAct(db, a, user.id)).sort((a, b) => a.filedAt.localeCompare(b.filedAt));
  const acted = db.applications.filter((a) => a.employeeId !== user.id && a.actions.some((x) => x.byId === user.id && x.step !== "FILED"));
  return (
    <>
      <PageHeader title="For My Action" subtitle={`${ROLE_LABEL[user.role]} · ${STEP_TEXT[user.role]}`} />
      <ApplicationsTable db={db} apps={queue} empty="You're all caught up — nothing is waiting for your action." />
      <h2 className="mb-3 mt-8 font-semibold text-slate-800">Previously acted on by me</h2>
      <ApplicationsTable db={db} apps={acted} empty="No actions yet." />
    </>
  );
}
