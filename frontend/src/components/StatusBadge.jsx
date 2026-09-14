const STYLES = {
  paid: "bg-status-paidBg text-status-paidText",
  due: "bg-status-dueBg text-status-dueText",
  overdue: "bg-status-overdueBg text-status-overdueText",
  inactive: "bg-status-inactiveBg text-status-inactiveText",
};

const LABELS = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
  inactive: "Inactive",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STYLES[status] || STYLES.inactive}`}>
      {LABELS[status] || status}
    </span>
  );
}
