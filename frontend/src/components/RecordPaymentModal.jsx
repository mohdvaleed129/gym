import { useState } from "react";
import api from "../services/api";
import { formatINR } from "../utils/formatCurrency";

export default function RecordPaymentModal({ member, onClose, onSuccess }) {
  const [amount, setAmount] = useState(String(member.currentDueAmount));
  const [paymentDate, setPaymentDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60 * 1000)
      .toISOString()
      .split("T")[0];
  });
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
if (!amount || Number(amount) <= 0) {
  setError("Payment amount must be greater than zero.");
  return;
}

if (method === "upi" && !reference.trim()) {
  setError("UPI transaction ID / UTR is required.");
  return;
}

if (Number(amount) > member.currentDueAmount) {
  setError(`Payment cannot exceed the outstanding balance of ${formatINR(member.currentDueAmount)}.`);
  return;
}

    setLoading(true);
    try {
      const res = await api.post("/payments", {
        memberId: member._id,
        amount: Number(amount),
        paymentDate,
        billingStart: member.currentBillingStart,
        billingEnd: member.currentBillingEnd,
        method,
        reference,
        note,
      });
      setConfirmation(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-status-paidText">Payment Successful</p>
          <h2 className="mt-2 text-lg font-bold text-ink">{member.fullName}</h2>
          <p className="text-sm text-muted">{member.memberCode}</p>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"> <dt className="text-muted">Amount</dt> <dd className="font-medium text-ink">{formatINR(confirmation.payment.amount)}</dd> </div>
            <div className="flex justify-between"><dt className="text-muted">Payment Date</dt><dd className="font-medium text-ink">{new Date(confirmation.payment.paymentDate).toLocaleDateString("en-IN")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Method</dt><dd className="font-medium capitalize text-ink">{confirmation.payment.method}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Next Due</dt><dd className="font-medium text-ink">{new Date(confirmation.nextDueDate).toLocaleDateString("en-IN")}</dd></div>
          </dl>
          <button className="btn-primary mt-5 w-full" onClick={onSuccess}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-ink">Record Payment</h2>
        <p className="text-sm text-muted">{member.fullName} ({member.memberCode})</p>
        <p className="mt-1 text-sm text-muted"> Outstanding:{" "} <span className="font-semibold text-status-dueText">{formatINR(member.currentDueAmount)} </span> </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="label">Amount</label>
            <input type="number" min="0" max={member.currentDueAmount} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" className="input" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label"> Reference {method === "upi" && <span className="text-status-overdueText">*</span>}</label>
            <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === "upi" ? "Enter UPI transaction ID / UTR" : "Optional"} />
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="text-sm text-status-overdueText">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : "Save Payment"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
