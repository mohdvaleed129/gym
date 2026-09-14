import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Search } from "lucide-react";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { formatINR } from "../../utils/formatCurrency";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [billingStatus, setBillingStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback((page = 1) => {
    setLoading(true);
    api
      .get("/members", { params: { page, search, status, billingStatus, sortBy } })
      .then((res) => {
        setMembers(res.data.members);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [search, status, billingStatus, sortBy]);

  useEffect(() => {
    const t = setTimeout(() => fetchMembers(1), 350);
    return () => clearTimeout(t);
  }, [fetchMembers]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members"
        subtitle={`${pagination.total ?? ""} total`}
        action={
          <Link to="/admin/members/new" className="btn-primary">
            <UserPlus size={16} /> Add Member
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search by name, mobile, or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input max-w-[150px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="input max-w-[160px]" value={billingStatus} onChange={(e) => setBillingStatus(e.target.value)}>
          <option value="">Any Fee Status</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="input max-w-[160px]" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Sort: Newest</option>
          <option value="fullName">Sort: Name</option>
          <option value="joiningDate">Sort: Joining Date</option>
          <option value="currentBillingEnd">Sort: Due Date</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="card hidden overflow-x-auto p-0 md:block">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Member ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Next Due</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={9} className="px-4 py-8 text-center text-muted">Loading members...</td></tr>}
            {!loading && members.length === 0 && <tr><td colSpan={9}><EmptyState message="No members found." /></td></tr>}
            {!loading && members.map((m) => (
              <tr key={m._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                    {m.photoUrl && <img src={`${import.meta.env.VITE_API_URL.replace("/api", "")}${m.photoUrl}`} className="h-full w-full object-cover" />}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-ink">{m.memberCode}</td>
                <td className="px-4 py-3 text-ink">{m.fullName}</td>
                <td className="px-4 py-3 text-muted">{m.mobile}</td>
                <td className="px-4 py-3 text-muted">{m.planNameSnapshot}</td>
                <td className="px-4 py-3 text-muted">{formatINR(m.currentDueAmount)}</td>
                <td className="px-4 py-3"><StatusBadge status={m.billingStatus} /></td>
                <td className="px-4 py-3 text-muted">{new Date(m.currentBillingEnd).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right"><Link to={`/admin/members/${m._id}`} className="text-brand hover:underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading && <p className="py-8 text-center text-muted">Loading members...</p>}
        {!loading && members.length === 0 && <EmptyState message="No members found." />}
        {!loading && members.map((m) => (
          <Link key={m._id} to={`/admin/members/${m._id}`} className="card block">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                {m.photoUrl && <img src={`${import.meta.env.VITE_API_URL.replace("/api", "")}${m.photoUrl}`} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{m.fullName}</p>
                <p className="text-xs text-muted">{m.memberCode} · {m.planNameSnapshot}</p>
              </div>
              <StatusBadge status={m.billingStatus} />
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted">Due {new Date(m.currentBillingEnd).toLocaleDateString("en-IN")}</span>
              <span className="font-medium text-ink">{formatINR(m.currentDueAmount)}</span>
            </div>
          </Link>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-outline" disabled={pagination.page <= 1} onClick={() => fetchMembers(pagination.page - 1)}>Previous</button>
          <span className="text-sm text-muted">Page {pagination.page} of {pagination.totalPages}</span>
          <button className="btn-outline" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchMembers(pagination.page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
