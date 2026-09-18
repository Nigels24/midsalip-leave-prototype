"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, QrCode } from "lucide-react";
import { APP } from "@/config/app";
import { ROLE_LABEL, fullName } from "@/data/employees";
import { useStore } from "@/lib/store";
import { Alert, Button, Input, Label } from "@/components/ui";
import { Seal } from "@/components/Seal";
import { useToast } from "@/components/toast";

// Accounts shown as one-click demo logins
const DEMO = ["jpepito", "mdizon", "treasurer", "hrmo", "mayor"];

export default function LoginPage() {
  const { ready, user, login, db } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== APP.demoPassword) return setError("Invalid username or password.");
    if (!login(username)) return setError("Invalid username or password, or the account is deactivated.");
    const acct = db.employees.find((x) => x.username === username);
    if (acct) toast(`Welcome back, ${acct.firstName}!`);
    router.replace("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/30" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-accent-400/10" />
        <div className="relative flex items-center gap-3">
          <Seal className="h-24 w-24" />
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-100/80">Republic of the Philippines</p>
            <p className="font-semibold">{APP.agency}</p>
            <p className="text-sm text-brand-100/80">{APP.province}</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">File, track and verify leave — without the paper chase.</h1>
          <p className="mt-4 text-brand-100/85">
            Apply online, see your leave credits anytime, follow your application through each signatory, and confirm the authenticity of any approved CS Form No. 6 by scanning its QR code.
          </p>
        </div>
        <p className="relative text-xs text-brand-100/70">{APP.footer}</p>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Seal className="h-16 w-16" />
            <div>
              <p className="font-semibold text-slate-900">{APP.agency}</p>
              <p className="text-xs text-slate-500">{APP.fullName}</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use the account issued by the {APP.office}.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <Alert>{error}</Alert>}
            <label className="block">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="e.g. jpepito" required />
            </label>
            <label className="block">
              <Label>Password</Label>
              <div className="relative">
                <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-10" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400" aria-label="Show password">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prototype demo accounts</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Click to fill in · password <code className="rounded bg-slate-100 px-1">{APP.demoPassword}</code>
            </p>
            <div className="mt-3 space-y-1.5">
              {DEMO.map((u) => {
                const e = db.employees.find((x) => x.username === u);
                if (!e) return null;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setUsername(u);
                      setPassword(APP.demoPassword);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-500 hover:bg-brand-50"
                  >
                    <span>
                      <span className="font-medium text-slate-800">{fullName(e)}</span>
                      <span className="block text-xs text-slate-500">{e.position}</span>
                    </span>
                    <span className="text-[11px] font-medium text-brand-700">{ROLE_LABEL[e.role]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Link href="/verify" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-brand-600 hover:underline">
            <QrCode size={16} /> Verify a leave document
          </Link>
        </div>
      </div>
    </div>
  );
}
