export default function DashboardStatCard({ label, value, tone = "default" }) {
  const toneClass = {
    default: "text-ink",
    danger: "text-status-overdueText",
    warning: "text-status-dueText",
    success: "text-status-paidText",
  }[tone];

  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
