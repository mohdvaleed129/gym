import { useEffect, useState } from "react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../context/ToastContext";
import { formatINR } from "../../utils/formatCurrency";

const emptyForm = { name: "", durationType: "months", durationValue: "1", fee: "" };

export default function Plans() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function load() {
    api.get("/plans").then((res) => setPlans(res.data.plans));
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.durationValue || form.fee === "") { setError("Please fill in all fields."); return; }
    try {
      await api.post("/plans", { ...form, durationValue: Number(form.durationValue), fee: Number(form.fee) });
      showToast("Plan created successfully.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save plan.");
    }
  }

  async function toggleActive(plan) {
    try {
      await api.put(`/plans/${plan._id}`, { active: !plan.active });
      showToast(`Plan ${plan.active ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to update plan.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Membership Plans" />

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {plans.map((p) => (
              <tr key={p._id}>
                <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-3 text-muted">{p.durationValue} {p.durationType}</td>
                <td className="px-4 py-3 text-ink">{formatINR(p.fee)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.active ? "bg-status-paidBg text-status-paidText" : "bg-status-inactiveBg text-status-inactiveText"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-brand hover:underline" onClick={() => toggleActive(p)}>
                    {p.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card max-w-lg">
        <h2 className="font-semibold text-ink">Add Plan</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="label">Plan Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duration Type</label>
              <select className="input" value={form.durationType} onChange={(e) => setForm({ ...form, durationType: e.target.value })}>
                <option value="days">Days</option>
                <option value="months">Months</option>
              </select>
            </div>
            <div>
              <label className="label">Duration Value</label>
              <input type="number" min="1" className="input" value={form.durationValue} onChange={(e) => setForm({ ...form, durationValue: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Fee (₹)</label>
            <input type="number" min="0" className="input" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
          </div>
          {error && <p className="text-sm text-status-overdueText">{error}</p>}
          <button className="btn-primary w-full">Add Plan</button>
        </form>
      </div>
    </div>
  );
}
