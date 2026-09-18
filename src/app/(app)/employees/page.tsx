"use client";
import Link from "next/link";
import { useState } from "react";
import { KeyRound, Pencil, Search, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { credits, logAudit, saveEmployee, uid } from "@/lib/engine";
import { OFFICES, office } from "@/data/offices";
import { ROLE_LABEL, fullName, type Employee, type Role } from "@/data/employees";
import { APP } from "@/config/app";
import { fmtDate, fmtNum } from "@/lib/format";
import { Alert, Badge, Button, Card, Empty, Input, Label, Modal, PageHeader, Select, Table } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm";

const blank = (): Employee => ({
  id: uid("E"),
  employeeNo: "",
  firstName: "",
  middleInitial: "",
  lastName: "",
  sex: "Female",
  position: "",
  salaryGrade: 1,
  monthlySalary: 0,
  officeId: OFFICES[0].id,
  status: "Permanent",
  originalAppointment: "",
  role: "EMPLOYEE",
  username: "",
  active: true,
  openingVL: 0,
  openingSL: 0,
});

export default function EmployeesPage() {
  const { db, user, commit } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [off, setOff] = useState("");
  const [role, setRole] = useState("");
  const [editing, setEditing] = useState<{ e: Employee; isNew: boolean } | null>(null);
  const [error, setError] = useState("");
  if (!user) return null;

  const rows = db.employees.filter(
    (e) =>
      (!off || e.officeId === off) &&
      (!role || e.role === role) &&
      `${fullName(e)} ${e.employeeNo} ${e.position} ${e.username}`.toLowerCase().includes(q.toLowerCase()),
  );

  const upd = (p: Partial<Employee>) => setEditing((s) => (s ? { ...s, e: { ...s.e, ...p } } : s));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editing) return;
    if (!editing.isNew) {
      const original = db.employees.find((x) => x.id === editing.e.id);
      if (original?.active && !editing.e.active) {
        const ok = await confirm({
          title: "Deactivate this account?",
          message: `${fullName(editing.e)} will no longer be able to sign in.`,
          tone: "danger",
          confirmLabel: "Deactivate",
        });
        if (!ok) return;
      }
    }
    try {
      commit(saveEmployee(db, editing.e, user.id, editing.isNew));
      toast(editing.isNew ? `Account created for ${fullName(editing.e)}.` : "Employee profile updated.");
      setEditing(null);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Employees & Accounts"
        subtitle="Maintain employee profiles and issue system accounts."
        action={
          <Button onClick={() => setEditing({ e: blank(), isNew: true })}>
            <UserPlus size={16} /> Add employee
          </Button>
        }
      />
      <Card>
        <div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search name, ID, position…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={off} onChange={(e) => setOff(e.target.value)}>
            <option value="">All offices</option>
            {OFFICES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            {Object.entries(ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        {rows.length === 0 ? (
          <Empty>No employees match.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Office</th>
                <th>Status</th>
                <th>Role / Username</th>
                <th className="text-right">VL</th>
                <th className="text-right">SL</th>
                <th>Account</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const c = credits(db, e.id);
                return (
                  <tr key={e.id} className={e.active ? "" : "opacity-60"}>
                    <td>
                      <p className="font-medium text-slate-800">{fullName(e)}</p>
                      <p className="text-xs text-slate-500">
                        {e.employeeNo} · {e.position}
                      </p>
                    </td>
                    <td className="whitespace-nowrap">{office(e.officeId)?.short}</td>
                    <td>{e.status}</td>
                    <td>
                      <p>{ROLE_LABEL[e.role]}</p>
                      <p className="font-mono text-xs text-slate-500">{e.username}</p>
                    </td>
                    <td className="text-right tabular-nums">{e.status === "Elective" ? "—" : fmtNum(c.vl)}</td>
                    <td className="text-right tabular-nums">{e.status === "Elective" ? "—" : fmtNum(c.sl)}</td>
                    <td>{e.active ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Active</Badge> : <Badge>Deactivated</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing({ e: { ...e }, isNew: false })} aria-label="Edit">
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Reset password"
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Reset password?",
                              message: `${fullName(e)}'s password will return to the default (${APP.demoPassword}).`,
                              tone: "danger",
                              confirmLabel: "Reset password",
                            });
                            if (!ok) return;
                            commit(logAudit(db, user.id, "RESET_PASSWORD", `${fullName(e)} (${e.username})`));
                            toast(`Password of ${e.username} reset to the default (${APP.demoPassword}).`);
                          }}
                        >
                          <KeyRound size={14} />
                        </Button>
                        {e.status !== "Elective" && (
                          <Link href={`/credits?emp=${e.id}`} className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-medium text-brand-600 hover:bg-brand-50">
                            Ledger
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          {rows.length} of {db.employees.length} employees
        </p>
      </Card>

      <Modal
        wide
        open={!!editing}
        onClose={() => {
          setEditing(null);
          setError("");
        }}
        title={editing?.isNew ? "Add employee & issue account" : "Edit employee"}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="emp-form">
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <form id="emp-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <F label="Employee ID No." required><Input required value={editing.e.employeeNo} onChange={(ev) => upd({ employeeNo: ev.target.value })} /></F>
            <F label="Sex">
              <Select value={editing.e.sex} onChange={(ev) => upd({ sex: ev.target.value as Employee["sex"] })}>
                <option>Female</option>
                <option>Male</option>
              </Select>
            </F>
            <F label="First name" required><Input required value={editing.e.firstName} onChange={(ev) => upd({ firstName: ev.target.value })} /></F>
            <div className="grid grid-cols-3 gap-2">
              <F label="M.I."><Input maxLength={2} value={editing.e.middleInitial} onChange={(ev) => upd({ middleInitial: ev.target.value.toUpperCase() })} /></F>
              <div className="col-span-2"><F label="Last name" required><Input required value={editing.e.lastName} onChange={(ev) => upd({ lastName: ev.target.value })} /></F></div>
            </div>
            <F label="Position" required><Input required value={editing.e.position} onChange={(ev) => upd({ position: ev.target.value })} /></F>
            <F label="Office" required>
              <Select value={editing.e.officeId} onChange={(ev) => upd({ officeId: ev.target.value })}>
                {OFFICES.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </F>
            <div className="grid grid-cols-2 gap-2">
              <F label="Salary grade"><Input type="number" min={1} max={33} value={editing.e.salaryGrade} onChange={(ev) => upd({ salaryGrade: +ev.target.value })} /></F>
              <F label="Monthly salary"><Input type="number" min={0} value={editing.e.monthlySalary} onChange={(ev) => upd({ monthlySalary: +ev.target.value })} /></F>
            </div>
            <F label="Employment status">
              <Select value={editing.e.status} onChange={(ev) => upd({ status: ev.target.value as Employee["status"] })}>
                <option>Permanent</option>
                <option>Casual</option>
                <option>Coterminous</option>
                <option>Elective</option>
              </Select>
            </F>
            <F label="Date of original appointment" required><Input type="date" required value={editing.e.originalAppointment} onChange={(ev) => upd({ originalAppointment: ev.target.value })} /></F>
            <F label="System role">
              <Select value={editing.e.role} onChange={(ev) => upd({ role: ev.target.value as Role })}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </F>
            <F label="Username" required><Input required value={editing.e.username} onChange={(ev) => upd({ username: ev.target.value.toLowerCase().replace(/\s/g, "") })} /></F>
            <F label="Account">
              <Select value={editing.e.active ? "1" : "0"} onChange={(ev) => upd({ active: ev.target.value === "1" })}>
                <option value="1">Active</option>
                <option value="0">Deactivated</option>
              </Select>
            </F>
            {editing.isNew && (
              <>
                <F label="Opening VL balance (from leave card)"><Input type="number" step="0.001" min={0} value={editing.e.openingVL} onChange={(ev) => upd({ openingVL: +ev.target.value })} /></F>
                <F label="Opening SL balance (from leave card)"><Input type="number" step="0.001" min={0} value={editing.e.openingSL} onChange={(ev) => upd({ openingSL: +ev.target.value })} /></F>
                <p className="text-xs text-slate-500 sm:col-span-2">
                  The default password will be <code className="rounded bg-slate-100 px-1">{APP.demoPassword}</code>. Opening balances are posted to the ledger as “Balance forwarded”.
                </p>
              </>
            )}
            {!editing.isNew && <p className="text-xs text-slate-500 sm:col-span-2">Appointed {fmtDate(editing.e.originalAppointment)}. Balances are adjusted through the ledger, not here.</p>}
            {error && <div className="sm:col-span-2"><Alert>{error}</Alert></div>}
          </form>
        )}
      </Modal>
    </>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label required={required}>{label}</Label>
      {children}
    </label>
  );
}
