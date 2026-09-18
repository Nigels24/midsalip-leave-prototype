"use client";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, ClipboardCheck, FilePlus2, Hourglass, Users, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { canAct, emp, isOpen, monthLabel, nextMonth, overlaps, postAccrual, toISODate } from "@/lib/engine";
import { leaveType } from "@/data/leaveTypes";
import { office } from "@/data/offices";
import { fullName, ROLE_LABEL } from "@/data/employees";
import { fmtDate, fmtRange, timeAgo } from "@/lib/format";
import { Button, Card, CardHeader, Empty, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { CreditCards } from "@/components/leave";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm";
import type { DbState, LeaveApplication } from "@/lib/types";

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

function QueueList({ db, apps }: { db: DbState; apps: LeaveApplication[] }) {
  if (apps.length === 0) return <Empty>Nothing is waiting for your action.</Empty>;
  return (
    <ul className="divide-y divide-slate-100">
      {apps.slice(0, 6).map((a) => {
        const e = emp(db, a.employeeId)!;
        return (
          <li key={a.id}>
            <Link href={`/application?id=${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                {e.firstName[0]}
                {e.lastName[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{fullName(e)}</p>
                <p className="truncate text-xs text-slate-500">
                  {leaveType(a.typeCode).name} · {a.days} day(s) · {fmtRange(a.startDate, a.endDate)}
                </p>
              </div>
              <span className="hidden text-xs text-slate-400 sm:block">{timeAgo(a.filedAt)}</span>
              <ArrowRight size={16} className="text-slate-300" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function OnLeaveList({ db, apps, empty }: { db: DbState; apps: LeaveApplication[]; empty: string }) {
  if (apps.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-slate-100">
      {apps.map((a) => {
        const e = emp(db, a.employeeId)!;
        return (
          <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{fullName(e)}</p>
              <p className="truncate text-xs text-slate-500">
                {office(e.officeId)?.short} · {leaveType(a.typeCode).name}
              </p>
            </div>
            <span className="whitespace-nowrap text-xs text-slate-600">{fmtRange(a.startDate, a.endDate)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Dashboard() {
  const { db, user, commit } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  if (!user) return null;

  const today = new Date();
  const t0 = toISODate(today);
  const t14 = toISODate(addDays(today, 14));
  const month = t0.slice(0, 7);
  const queue = db.applications.filter((a) => canAct(db, a, user.id)).sort((a, b) => a.filedAt.localeCompare(b.filedAt));
  const mine = db.applications.filter((a) => a.employeeId === user.id);
  const upcoming = (filter: (a: LeaveApplication) => boolean) =>
    db.applications.filter((a) => a.status === "APPROVED" && overlaps(a.startDate, a.endDate, t0, t14) && filter(a)).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  const header = (
    <PageHeader
      title={`${greeting}, ${user.firstName}!`}
      subtitle={`${ROLE_LABEL[user.role]} · ${office(user.officeId)?.name} · ${today.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`}
      action={
        user.role !== "APPROVER" && (
          <Link href="/apply">
            <Button>
              <FilePlus2 size={16} /> File a leave
            </Button>
          </Link>
        )
      }
    />
  );

  // ── EMPLOYEE ──────────────────────────────────────────
  if (user.role === "EMPLOYEE") {
    const myNotifs = db.notifications.filter((n) => n.userId === user.id).slice(0, 5);
    const myUpcoming = upcoming((a) => a.employeeId === user.id);
    return (
      <>
        {header}
        <CreditCards db={db} employeeId={user.id} />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="My recent applications" action={<Link href="/applications" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>} />
            {mine.length === 0 ? (
              <Empty>You have not filed any leave yet.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {mine.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href={`/application?id=${a.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{leaveType(a.typeCode).name}</p>
                        <p className="text-xs text-slate-500">
                          {fmtRange(a.startDate, a.endDate)} · {a.days} day(s) · <span className="font-mono">{a.refNo}</span>
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader title="My upcoming leave" subtitle="Next 14 days" />
              <OnLeaveList db={db} apps={myUpcoming} empty="No approved leave in the next two weeks." />
            </Card>
            <Card>
              <CardHeader title="Latest updates" />
              {myNotifs.length === 0 ? (
                <Empty>No notifications.</Empty>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {myNotifs.map((n) => (
                    <li key={n.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </>
    );
  }

  // ── DEPARTMENT HEAD ───────────────────────────────────
  if (user.role === "DEPT_HEAD") {
    const staff = db.employees.filter((e) => e.officeId === user.officeId && e.active);
    const officeUpcoming = upcoming((a) => emp(db, a.employeeId)?.officeId === user.officeId);
    const onLeaveToday = officeUpcoming.filter((a) => overlaps(a.startDate, a.endDate, t0, t0)).length;
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Awaiting my recommendation" value={queue.length} icon={<ClipboardCheck size={20} />} tone="amber" />
          <Stat label="Personnel in my office" value={staff.length} icon={<Users size={20} />} />
          <Stat label="On leave today" value={onLeaveToday} hint={`${officeUpcoming.length} approved in the next 14 days`} icon={<CalendarCheck2 size={20} />} tone="sky" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="For my recommendation" action={<Link href="/approvals" className="text-sm font-medium text-brand-600 hover:underline">Open queue</Link>} />
            <QueueList db={db} apps={queue} />
          </Card>
          <Card>
            <CardHeader title="Office staffing" subtitle="Approved leave, next 14 days" />
            <OnLeaveList db={db} apps={officeUpcoming} empty="No one from your office is scheduled on leave." />
          </Card>
        </div>
        <h2 className="mb-3 mt-8 font-semibold text-slate-800">My leave credits</h2>
        <CreditCards db={db} employeeId={user.id} />
      </>
    );
  }

  // ── HRMO ──────────────────────────────────────────────
  if (user.role === "HRMO") {
    const open = db.applications.filter((a) => isOpen(a.status)).length;
    const approvedMonth = db.applications.filter((a) => a.status === "APPROVED" && a.actions.some((x) => x.step === "APPROVED" && x.at.startsWith(month))).length;
    const active = db.employees.filter((e) => e.active).length;
    const next = nextMonth(db.lastAccrualMonth);
    const canPost = next <= month;
    const year = t0.slice(0, 4);
    const byType = new Map<string, number>();
    db.applications
      .filter((a) => a.status === "APPROVED" && a.startDate.startsWith(year))
      .forEach((a) => byType.set(a.typeCode, (byType.get(a.typeCode) ?? 0) + a.days));
    const max = Math.max(1, ...byType.values());
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="For my certification" value={queue.length} icon={<ClipboardCheck size={20} />} tone="amber" />
          <Stat label="All pending applications" value={open} icon={<Hourglass size={20} />} tone="violet" />
          <Stat label="Approved this month" value={approvedMonth} icon={<CheckCircle2 size={20} />} />
          <Stat label="Active employees" value={active} icon={<Users size={20} />} tone="sky" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="For certification of leave credits" action={<Link href="/approvals" className="text-sm font-medium text-brand-600 hover:underline">Open queue</Link>} />
            <QueueList db={db} apps={queue} />
          </Card>
          <div className="space-y-6">
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-800">Monthly leave credit accrual</p>
              <p className="mt-1 text-sm text-slate-500">
                Last posted: <b className="text-slate-700">{monthLabel(db.lastAccrualMonth)}</b>
              </p>
              <p className="mt-1 text-xs text-slate-500">Adds 1.25 VL and 1.25 SL to every active, non-elective employee.</p>
              <Button
                className="mt-4 w-full"
                variant={canPost ? "primary" : "outline"}
                onClick={async () => {
                  const ok = await confirm({
                    title: "Post leave credits?",
                    message: `This adds 1.25 VL and 1.25 SL to every active employee for ${monthLabel(next)}.`,
                    tone: "primary",
                    confirmLabel: "Post credits",
                  });
                  if (!ok) return;
                  const r = postAccrual(db, user.id);
                  commit(r.db);
                  toast(`Credits for ${monthLabel(r.month)} posted to ${r.count} employees.`);
                }}
              >
                Post credits for {monthLabel(next)}
              </Button>
              {!canPost && <p className="mt-2 text-center text-[11px] text-slate-400">Normally posted at month-end (enabled for demo).</p>}
            </Card>
            <Card>
              <CardHeader title={`Days of leave approved, ${year}`} />
              <div className="space-y-3 p-5">
                {byType.size === 0 && <p className="text-sm text-slate-500">No approved leave yet.</p>}
                {[...byType.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([code, days]) => (
                    <div key={code}>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{leaveType(code).name}</span>
                        <span className="font-semibold tabular-nums">{days}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(days / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
        <h2 className="mb-3 mt-8 font-semibold text-slate-800">My leave credits</h2>
        <CreditCards db={db} employeeId={user.id} />
      </>
    );
  }

  // ── APPROVING AUTHORITY ───────────────────────────────
  const approvedMonth = db.applications.filter((a) => a.actions.some((x) => x.step === "APPROVED" && x.byId === user.id && x.at.startsWith(month))).length;
  const disapproved = db.applications.filter((a) => a.status === "DISAPPROVED").length;
  const allUpcoming = upcoming(() => true);
  return (
    <>
      {header}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting my final action" value={queue.length} icon={<ClipboardCheck size={20} />} tone="amber" />
        <Stat label="Approved by me this month" value={approvedMonth} icon={<CheckCircle2 size={20} />} />
        <Stat label="Disapproved (all time)" value={disapproved} icon={<XCircle size={20} />} tone="red" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="For final approval" action={<Link href="/approvals" className="text-sm font-medium text-brand-600 hover:underline">Open queue</Link>} />
          <QueueList db={db} apps={queue} />
        </Card>
        <Card>
          <CardHeader title="Personnel on leave" subtitle={`${fmtDate(t0)} – ${fmtDate(t14)}`} />
          <OnLeaveList db={db} apps={allUpcoming} empty="No approved leave in the next two weeks." />
        </Card>
      </div>
    </>
  );
}
