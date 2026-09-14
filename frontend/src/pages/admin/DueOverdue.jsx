import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../context/ToastContext";

function Section({ title, members, reminderType, onRemind }) {
  return (
    <div className="card overflow-x-auto p-0">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-semibold text-ink">{title} <span className="text-muted font-normal">({members.length})</span></h2>
      </div>
      {members.length === 0 ? (
        <EmptyState message={`No members ${title.toLowerCase()}.`} />
      ) : (
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Amount Due</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Days Overdue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => (
              <tr key={m._id}>
                <td className="px-4 py-3 font-medium text-ink">{m.fullName} <span className="text-muted font-normal">({m.memberCode})</span></td>
                <td className="px-4 py-3 text-muted">{m.mobile}</td>
                <td className="px-4 py-3 text-ink">{m.currentDueAmount}</td>
                <td className="px-4 py-3 text-muted">{new Date(m.currentBillingEnd).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-muted">{m.daysOverdue > 0 ? m.daysOverdue : "-"}</td>
                <td className="px-4 py-3"><StatusBadge status={m.billingStatus} /></td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link to={`/admin/members/${m._id}`} className="text-brand hover:underline">View</Link>
                  <button className="text-brand hover:underline" onClick={() => onRemind(m, reminderType)}>Remind</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function DueOverdue() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/fees/due").then((res) => setData(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRemind(member, type) {
    try {
      const res = await api.post("/notifications/remind", { memberId: member._id, type });
      if (res.data.notification.status === "failed") {
        showToast(res.data.notification.errorMessage || "Notification could not be sent.", "error");
      } else {
        showToast(`Reminder sent to ${member.fullName}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to send reminder.", "error");
    }
  }

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Due & Overdue" subtitle="Members who need to pay, grouped by urgency." />
      <Section title="Due Today" members={data.dueToday} reminderType="due" onRemind={handleRemind} />
      <Section title="Due Soon" members={data.dueSoon} reminderType="reminder_before" onRemind={handleRemind} />
      <Section title="Overdue" members={data.overdue} reminderType="overdue" onRemind={handleRemind} />
    </div>
  );
}
