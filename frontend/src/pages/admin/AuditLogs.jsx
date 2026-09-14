import { useEffect, useState } from "react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  function load(page = 1) {
    setLoading(true);
    api.get("/audit-logs", { params: { page } })
      .then((res) => { setLogs(res.data.logs); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(1); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Log" subtitle="A record of important administrative actions." />
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Time</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Loading...</td></tr>}
            {!loading && logs.length === 0 && <tr><td colSpan={4}><EmptyState message="No activity recorded yet." /></td></tr>}
            {!loading && logs.map((l) => (
              <tr key={l._id}>
                <td className="px-4 py-3 font-medium text-ink">{l.adminName || "-"}</td>
                <td className="px-4 py-3 text-muted">{l.action}</td>
                <td className="px-4 py-3 text-muted">{l.details}</td>
                <td className="px-4 py-3 text-muted">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
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
    </div>
  );
}
