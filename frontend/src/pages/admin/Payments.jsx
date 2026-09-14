import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";
import { formatINR } from "../../utils/formatCurrency";

export default function Payments() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  function load(page = 1) {
    setLoading(true);
    api.get("/payments", { params: { page } })
      .then((res) => { setPayments(res.data.payments); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); }, []);

  async function handleVoid() {
    if (!voidReason.trim()) { showToast("Please provide a reason.", "error"); return; }
    try {
      await api.patch(`/payments/${voidTarget._id}/void`, { reason: voidReason });
      showToast("Payment voided successfully.");
      setVoidTarget(null);
      setVoidReason("");
      load(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to void payment.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" subtitle="Most recent payment records across all members." />

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Member ID</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Billing Period</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Loading payments...</td></tr>}
            {!loading && payments.length === 0 && <tr><td colSpan={7}><EmptyState message="No payment records found." /></td></tr>}
            {!loading && payments.map((p) => (
              <tr key={p._id}>
                <td className="px-4 py-3 font-medium text-ink">
                  <Link to={`/admin/members/${p.member?._id}`} className="hover:underline">{p.member?.fullName}</Link>
                </td>
                <td className="px-4 py-3 text-muted">{p.member?.memberCode}</td>
                <td className="px-4 py-3 text-ink">{formatINR(p.amount)}</td>
                <td className="px-4 py-3 text-muted">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-muted">{new Date(p.billingStart).toLocaleDateString("en-IN")} – {new Date(p.billingEnd).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-muted capitalize">{p.method}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-status-overdueText hover:underline" onClick={() => setVoidTarget(p)}>Void</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-outline" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Previous</button>
          <span className="text-sm text-muted">Page {pagination.page} of {pagination.totalPages}</span>
          <button className="btn-outline" disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}>Next</button>
        </div>
      )}

      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-ink">Void this payment?</h2>
            <p className="mt-2 text-sm text-muted">
              {formatINR(voidTarget.amount)} for {voidTarget.member?.fullName}. This will not delete the record - it will be marked voided and preserved for audit.
            </p>
            <label className="label mt-3">Reason</label>
            <input className="input" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="e.g. Entered by mistake" />
            <div className="mt-4 flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => { setVoidTarget(null); setVoidReason(""); }}>Cancel</button>
              <button className="btn-danger flex-1" onClick={handleVoid}>Void Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
