import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import DashboardStatCard from "../../components/DashboardStatCard";
import { formatINR } from "../../utils/formatCurrency";

export default function Reports() {
  const [collection, setCollection] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/reports/collection").then((res) => setCollection(res.data));
    api.get("/reports/members-summary").then((res) => setSummary(res.data));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" subtitle="Collection and membership summaries from actual payment records." />

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <DashboardStatCard label="Total Members" value={summary.total} />
          <DashboardStatCard label="Active" value={summary.active} tone="success" />
          <DashboardStatCard label="Inactive" value={summary.inactive} />
          <DashboardStatCard label="Overdue" value={summary.overdue} tone="danger" />
          <DashboardStatCard label="New This Month" value={summary.newThisMonth} />
        </div>
      )}

      <div className="card">
        <h2 className="mb-4 font-semibold text-ink">Daily Collection</h2>
        {collection?.daily?.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={collection.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#1F3A5F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted">No payment records found for this period.</p>
        )}
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3"><h2 className="font-semibold text-ink">Monthly Collection</h2></div>
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Month</th><th className="px-4 py-3">Payments</th><th className="px-4 py-3">Total Collected</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(!collection?.monthly || collection.monthly.length === 0) && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted">No payment records found.</td></tr>
            )}
            {collection?.monthly?.map((m) => (
              <tr key={m._id}>
                <td className="px-4 py-3 text-ink">{m._id}</td>
                <td className="px-4 py-3 text-muted">{m.count}</td>
                <td className="px-4 py-3 font-medium text-ink">{formatINR(m.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
