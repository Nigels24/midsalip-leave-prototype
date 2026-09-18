export function Seal({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Municipal Government of Midsalip seal"
      className={["object-contain", className].filter(Boolean).join(" ")}
    />
  );
}
