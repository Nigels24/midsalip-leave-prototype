"use client";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, PageHeader } from "@/components/ui";
import { ApplicationsTable } from "@/components/leave";

export default function MyApplicationsPage() {
  const { db, user } = useStore();
  if (!user) return null;
  const mine = db.applications.filter((a) => a.employeeId === user.id);
  return (
    <>
      <PageHeader
        title="My Applications"
        subtitle="Track every leave you have filed and where it is in the approval process."
        action={
          <Link href="/apply">
            <Button>
              <FilePlus2 size={16} /> File a leave
            </Button>
          </Link>
        }
      />
      <ApplicationsTable db={db} apps={mine} showEmployee={false} empty="You have not filed any leave yet." />
    </>
  );
}
