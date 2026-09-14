import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Wallet, AlertCircle } from "lucide-react";
import api from "../../services/api";
import DashboardStatCard from "../../components/DashboardStatCard";
import PageHeader from "../../components/PageHeader";
import { formatINR } from "../../utils/formatCurrency";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Loading dashboard...</p>;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="An overview of BODY FLEX today." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <DashboardStatCard label="Total Members" value={data.totalMembers} />
        <DashboardStatCard label="Active Members" value={data.activeMembers} tone="success" />
        <DashboardStatCard label="Due Today" value={data.dueToday} tone="warning" />
        <DashboardStatCard label="Overdue" value={data.overdue} tone="danger" />
        <DashboardStatCard label="Today's Collection" value={formatINR(data.todaysCollection)}/>
        <DashboardStatCard label="Monthly Collection" value={formatINR(data.monthlyCollection)}/>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to="/admin/members/new" className="card flex items-center gap-3 font-medium text-brand hover:bg-brand-50">
            <UserPlus size={18} /> Add Member
          </Link>
          <Link to="/admin/payments" className="card flex items-center gap-3 font-medium text-brand hover:bg-brand-50">
            <Wallet size={18} /> Record Payment
          </Link>
          <Link to="/admin/due" className="card flex items-center gap-3 font-medium text-brand hover:bg-brand-50">
            <AlertCircle size={18} /> View Due Members
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Recent Payments</h2>
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.recentPayments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No payment records found.</td></tr>
              )}
              {data.recentPayments.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3 font-medium text-ink">{p.member?.fullName}</td>
                  <td className="px-4 py-3 text-muted">{p.member?.memberCode}</td>
                  <td className="px-4 py-3 text-ink">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3 text-muted">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-muted capitalize">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
