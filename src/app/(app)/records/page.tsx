"use client";
import { useStore } from "@/lib/store";
import { emp } from "@/lib/engine";
import { office } from "@/data/offices";
import { PageHeader } from "@/components/ui";
import { ApplicationsTable } from "@/components/leave";

export default function RecordsPage() {
  const { db, user } = useStore();
  if (!user) return null;
  const scoped = user.role === "DEPT_HEAD";
  const apps = scoped ? db.applications.filter((a) => emp(db, a.employeeId)?.officeId === user.officeId) : db.applications;
  return (
    <>
      <PageHeader
        title="Leave Records"
        subtitle={scoped ? `All applications filed by personnel of the ${office(user.officeId)?.name}.` : "All leave applications filed in the municipal hall."}
      />
      <ApplicationsTable db={db} apps={apps} showEmployee />
    </>
  );
}
