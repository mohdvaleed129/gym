import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Dumbbell, Users, TrendingUp } from "lucide-react";
import api from "../../services/api";

export default function Home() {
  const { settings } = useOutletContext();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get("/plans?activeOnly=true").then((res) => setPlans(res.data.plans)).catch(() => {});
  }, []);

  return (
    <div>
      <section className="border-b border-line bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{settings?.gymName || "BODY FLEX"}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            A disciplined space to train, track and grow.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Clean facilities, structured membership management and a straightforward member experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/membership" className="btn-primary">View Membership</Link>
            <Link to="/contact" className="btn-outline">Contact Us</Link>
            <Link to="/login" className="btn-secondary">Member / Admin Login</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            [Dumbbell, "Modern Equipment", "A well-maintained facility with strength and cardio equipment for every level."],
            [Users, "Experienced Trainers", "Coaches focused on form, consistency and long-term progress."],
            [TrendingUp, "Organized Membership", "Clear plans, transparent fees, and a system that never loses track of a payment."],
          ].map(([Icon, title, desc]) => (
            <div key={title} className="card">
              <Icon className="text-brand" size={22} />
              <h3 className="mt-3 font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {plans.length > 0 && (
        <section className="border-t border-line bg-gray-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold text-ink">Membership Plans</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {plans.map((p) => (
                <div key={p._id} className="card text-center">
                  <h3 className="font-semibold text-ink">{p.name}</h3>
                  <p className="mt-2 text-2xl font-bold text-brand">₹{p.fee.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted">
                    {p.durationValue} {p.durationType}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
