import { useEffect, useState } from "react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";

const STATUS_STYLES = {
  sent: "bg-status-paidBg text-status-paidText",
  failed: "bg-status-overdueBg text-status-overdueText",
  queued: "bg-status-dueBg text-status-dueText",
};

export default function Notifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/notifications", { params: { status: filter || undefined } })
      .then((res) => setNotifications(res.data.notifications))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  async function retry(id) {
    try {
      await api.patch(`/notifications/${id}/retry`);
      showToast("Retry attempted.");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to retry.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Notification Center" subtitle="Fee reminders and payment confirmations sent to members." />

      <div className="flex gap-2">
        {["", "sent", "failed", "queued"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === s ? "bg-brand text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Loading notifications...</td></tr>}
            {!loading && notifications.length === 0 && <tr><td colSpan={7}><EmptyState message="No notifications found." /></td></tr>}
            {!loading && notifications.map((n) => (
              <tr key={n._id}>
                <td className="px-4 py-3 font-medium text-ink">{n.member?.fullName} <span className="font-normal text-muted">({n.member?.memberCode})</span></td>
                <td className="px-4 py-3 text-muted capitalize">{n.type.replaceAll("_", " ")}</td>
                <td className="px-4 py-3 text-muted capitalize">{n.channel}</td>
                <td className="px-4 py-3 text-muted">{new Date(n.scheduledAt).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-muted">{n.sentAt ? new Date(n.sentAt).toLocaleString("en-IN") : "-"}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_STYLES[n.status]}`}>{n.status}</span>
                  {n.status === "failed" && <p className="mt-1 text-xs text-muted">{n.errorMessage}</p>}
                </td>
                <td className="px-4 py-3 text-right">
                  {n.status === "failed" && <button className="text-brand hover:underline" onClick={() => retry(n._id)}>Retry</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
