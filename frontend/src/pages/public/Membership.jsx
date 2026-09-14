import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function Membership() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/plans?activeOnly=true").then((res) => setPlans(res.data.plans)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-ink">Membership Plans</h1>
      <p className="mt-2 text-center text-muted">Fees are managed and updated by BODY FLEX staff.</p>
      {loading && <p className="mt-8 text-center text-muted">Loading plans...</p>}
      {!loading && plans.length === 0 && <p className="mt-8 text-center text-muted">Plans will be published here soon.</p>}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p._id} className="card text-center">
            <h3 className="font-semibold text-ink">{p.name}</h3>
            <p className="mt-2 text-2xl font-bold text-brand">₹{p.fee.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted">{p.durationValue} {p.durationType}</p>
            <Link to="/contact" className="btn-outline mt-4 w-full">Enquire</Link>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted">Online payment is not available yet. Membership fees are payable at the gym.</p>
    </div>
  );
}
