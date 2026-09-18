export const fmtDate = (s: string) =>
  s ? new Date(s.length === 10 ? s + "T00:00" : s).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export const fmtRange = (a: string, b: string) => (a === b ? fmtDate(a) : `${fmtDate(a)} – ${fmtDate(b)}`);

export const fmtNum = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const fmtDays = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

export const peso = (n: number) => n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export const timeAgo = (s: string) => {
  const diff = (Date.now() - new Date(s).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(s);
};
