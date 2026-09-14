import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Wallet, Bell, Ban, CheckCircle2, Trash2 } from "lucide-react";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import RecordPaymentModal from "../../components/RecordPaymentModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { formatINR } from "../../utils/formatCurrency";

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function load() {
    setLoading(true);
    api.get(`/members/${id}`).then((res) => setData(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function toggleStatus() {
    const nextStatus = data.member.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/members/${id}/status`, { status: nextStatus });
      showToast(`Member ${nextStatus === "inactive" ? "deactivated" : "activated"} successfully.`);
      setConfirmStatus(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to update status.", "error");
    }
  }
  async function deleteMember() {
    try {
      await api.delete(`/members/${id}`);

      setConfirmDelete(false);
      showToast("Member permanently deleted.");
      navigate("/admin/members");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Unable to delete member.",
        "error"
      );
    }
  }

  async function sendReminder(type) {
    try {
      const res = await api.post("/notifications/remind", { memberId: id, type });
      if (res.data.notification.status === "failed") {
        showToast(res.data.notification.errorMessage || "Notification could not be sent.", "error");
      } else {
        showToast("Reminder sent successfully.");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to send reminder.", "error");
    }
  }

  if (loading) return <p className="text-muted">Loading member profile...</p>;
  if (!data) return <p className="text-muted">Member not found.</p>;

  const { member, payments, summary } = data;
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const photoBase = apiUrl.replace(/\/api\/?$/, "");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
            {member.photoUrl && ( <img src={`${photoBase}${member.photoUrl}`} alt={`${member.fullName} profile`} className="h-full w-full object-cover" /> )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-ink">{member.fullName}</h1>
            <p className="text-sm text-muted">{member.memberCode}</p>
            <div className="mt-1"><StatusBadge status={member.billingStatus} /></div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setShowPayment(true)}><Wallet size={16} /> Record Payment</button>
            <Link to={`/admin/members/${id}/edit`} className="btn-outline">Edit</Link>
          </div>
        </div>

        {member.billingStatus !== "paid" && member.billingStatus !== "inactive" && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <button className="btn-outline text-sm" onClick={() => sendReminder(member.billingStatus === "overdue" ? "overdue" : "due")}>
              <Bell size={14} /> Send Reminder
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-ink">Personal Information</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Name" value={member.fullName} />
            <Row label="Date of Birth" value={member.dob ? new Date(member.dob).toLocaleDateString("en-IN") : "-"} />
            <Row label="Mobile" value={member.mobile} />
            <Row label="Address" value={member.address || "-"} />
            <Row label="Joining Date" value={new Date(member.joiningDate).toLocaleDateString("en-IN")} />
          </dl>
        </div>

        <div className="card">
          <h2 className="font-semibold text-ink">Membership Information</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Plan" value={member.planNameSnapshot} />
            <Row label="Fee" value={formatINR(member.feeAmount)} />
            <Row label="Cycle Start" value={new Date(member.currentBillingStart).toLocaleDateString("en-IN")} />
            <Row label="Next Due Date" value={new Date(member.currentBillingEnd).toLocaleDateString("en-IN")} />
            <Row label="Billing Status" value={<StatusBadge status={member.billingStatus} />} />
          </dl>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-ink">Payment Summary</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <SummaryStat label="Total Fee" value={formatINR(summary.totalFee)} />
          <SummaryStat label="Total Paid" value={formatINR(summary.totalPaid)} />
          <SummaryStat label="Current Due" value={formatINR(summary.currentDue)} tone={summary.currentDue > 0 ? "warning" : "success"} />
          <SummaryStat label="Last Payment" value={summary.latestPayment ? new Date(summary.latestPayment.paymentDate).toLocaleDateString("en-IN") : "-"} />
        </dl>
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3"><h2 className="font-semibold text-ink">Payment History</h2></div>
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Billing Period</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {payments.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No payment records found.</td></tr>}
            {payments.map((p) => (
              <tr key={p._id} className={p.status === "voided" ? "opacity-50" : ""}>
                <td className="px-4 py-3 text-ink">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-ink">{formatINR(p.amount)}</td>
                <td className="px-4 py-3 text-muted"> {new Date(p.billingStart).toLocaleDateString("en-IN")} – {new Date(p.billingEnd).toLocaleDateString("en-IN")} </td>                <td className="px-4 py-3 text-muted capitalize">{p.method}</td>
                <td className="px-4 py-3 text-muted">{p.reference || "-"}</td>
                <td className="px-4 py-3">
                  {p.status === "voided" ? <span className="badge bg-status-inactiveBg text-status-inactiveText">Voided</span> : <span className="badge bg-status-paidBg text-status-paidText">Active</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="btn-outline text-sm text-status-overdueText"
          onClick={() => setConfirmStatus(true)}
        >
        {member.status === "active" ? (
        <>
          <Ban size={14} /> Deactivate Member
        </>
         ) : (
        <>
          <CheckCircle2 size={14} /> Activate Member
        </>
        )}
        </button>

        <button
          className="btn-outline text-sm text-red-600"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={14} /> Delete Member
        </button>
      </div>

      {showPayment && (
        <RecordPaymentModal
          member={member}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); showToast("Payment recorded successfully."); load(); }}
        />
      )}

      {confirmStatus && (
        <ConfirmDialog
          title={member.status === "active" ? "Deactivate member?" : "Activate member?"}
          message={`Are you sure you want to ${member.status === "active" ? "deactivate" : "activate"} ${member.fullName} (${member.memberCode})?`}
          onConfirm={toggleStatus}
          onCancel={() => setConfirmStatus(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Permanently delete member?"
          message={`This will permanently delete ${member.fullName} (${member.memberCode}) and all associated payment records. This action cannot be undone.`}
          onConfirm={deleteMember}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line/60 pb-2 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function SummaryStat({ label, value, tone = "default" }) {
  const cls = { default: "text-ink", warning: "text-status-dueText", success: "text-status-paidText" }[tone];
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-semibold ${cls}`}>{value}</p>
    </div>
  );
}
