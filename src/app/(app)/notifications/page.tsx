"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import { Button, Card, Empty, PageHeader, cn } from "@/components/ui";

export default function NotificationsPage() {
  const { db, user, commit } = useStore();
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  if (!user) return null;
  const mine = db.notifications.filter((n) => n.userId === user.id && (!unreadOnly || !n.read));
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length;
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setUnreadOnly((u) => !u)}>
              {unreadOnly ? "Show all" : "Unread only"}
            </Button>
            <Button variant="secondary" size="sm" disabled={!unread} onClick={() => commit({ ...db, notifications: db.notifications.map((n) => (n.userId === user.id ? { ...n, read: true } : n)) })}>
              Mark all as read
            </Button>
          </div>
        }
      />
      <Card>
        {mine.length === 0 ? (
          <Empty>No notifications.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mine.map((n) => (
              <li key={n.id}>
                <button
                  className={cn("flex w-full gap-3 px-5 py-4 text-left hover:bg-slate-50", !n.read && "bg-brand-50/50")}
                  onClick={() => {
                    commit({ ...db, notifications: db.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)) });
                    if (n.appId) router.push(`/application?id=${n.appId}`);
                  }}
                >
                  <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", n.read ? "bg-slate-100 text-slate-400" : "bg-brand-100 text-brand-700")}>
                    <Bell size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className={cn("text-sm", n.read ? "text-slate-700" : "font-semibold text-slate-900")}>{n.title}</span>
                      <span className="text-xs text-slate-400">{fmtDateTime(n.at)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-600">{n.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
