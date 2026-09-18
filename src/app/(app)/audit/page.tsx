"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { empName } from "@/lib/engine";
import { fmtDateTime } from "@/lib/format";
import { Badge, Card, Empty, Input, PageHeader, Table } from "@/components/ui";

export default function AuditPage() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const rows = db.audit.filter((a) => `${a.action} ${a.detail} ${empName(db, a.byId)}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Audit Trail" subtitle="Every action performed in the system, with the acting user and timestamp (Data Privacy Act compliance)." />
      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search user, action, reference…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {rows.length === 0 ? (
          <Empty>No matching entries.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Date &amp; time</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-slate-500">{fmtDateTime(a.at)}</td>
                  <td className="whitespace-nowrap font-medium">{empName(db, a.byId)}</td>
                  <td>
                    <Badge>{a.action.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="text-slate-600">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
