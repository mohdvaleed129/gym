import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../services/api";

export default function Contact() {
  const { settings } = useOutletContext();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", message: "" });
  const [state, setState] = useState({ loading: false, success: "", error: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, success: "", error: "" });
    try {
      const res = await api.post("/enquiries", form);
      setState({ loading: false, success: res.data.message, error: "" });
      setForm({ name: "", mobile: "", email: "", message: "" });
    } catch (err) {
      setState({ loading: false, success: "", error: err.response?.data?.message || "Unable to submit. Please try again." });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-ink">Contact Us</h1>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="card space-y-2">
          <h3 className="font-semibold text-ink">{settings?.gymName || "BODY FLEX"}</h3>
          <p className="text-sm text-muted">{settings?.address}</p>
          <p className="text-sm text-muted">Phone: {settings?.phone}</p>
          <p className="text-sm text-muted">Email: {settings?.email}</p>
          <p className="text-sm text-muted">Hours: {settings?.openingHours}</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Mobile</label>
            <input className="input" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          {state.error && <p className="text-sm text-status-overdueText">{state.error}</p>}
          {state.success && <p className="text-sm text-status-paidText">{state.success}</p>}
          <button className="btn-primary w-full" disabled={state.loading}>{state.loading ? "Sending..." : "Send Message"}</button>
        </form>
      </div>
    </div>
  );
}
