import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import { formatINR } from "../../utils/formatCurrency";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export default function AddMember() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [plans, setPlans] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    mobile: "",
    address: "",
    joiningDate: new Date().toISOString().split("T")[0],
    planId: "",
    feeAmount: "",
    initialAmount: "",
    method: "cash",
    reference: "",
    status: "active",
  });
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [duplicateConfirmNeeded, setDuplicateConfirmNeeded] = useState(false);

  useEffect(() => {
    api.get("/plans?activeOnly=true").then((res) => setPlans(res.data.plans));
  }, []);

  const selectedPlan = plans.find((p) => p._id === form.planId);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be smaller than 5MB.");
      return;
    }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function validate() {
    if (!form.fullName || !form.mobile || !form.joiningDate || !form.planId) {
      return "Full name, mobile, joining date, and membership plan are required.";
    }
    if (!INDIAN_MOBILE_REGEX.test(form.mobile)) return "Please enter a valid Indian mobile number.";
    const fee = form.feeAmount !== "" ? Number(form.feeAmount) : selectedPlan?.fee;
    if (fee === undefined || fee < 0) return "Fee amount must be zero or greater.";
    if (form.initialAmount && Number(form.initialAmount) > fee) return "Initial payment cannot exceed the fee amount.";
    return "";
  }

  function handleSubmitClick(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError("");
    setConfirming(true);
  }

  async function handleConfirmCreate() {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("mobile", form.mobile);
      fd.append("joiningDate", form.joiningDate);
      fd.append("planId", form.planId);
      fd.append("status", form.status);
      if (form.dob) fd.append("dob", form.dob);
      if (form.address) fd.append("address", form.address);
      if (form.feeAmount !== "") fd.append("feeAmount", form.feeAmount);
      if (duplicateConfirmNeeded) fd.append("confirmDuplicateMobile", "true");
      if (form.initialAmount) {
        fd.append("initialPayment", JSON.stringify({ amount: Number(form.initialAmount), method: form.method, reference: form.reference }));
      }
      if (photoFile) fd.append("photo", photoFile);

      const res = await api.post("/members", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(res.data.member);
      setConfirming(false);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.message?.includes("mobile number already exists")) {
        setError(err.response.data.message);
        setDuplicateConfirmNeeded(true);
      } else {
        setError(err.response?.data?.message || "Unable to save member. Please try again.");
        setConfirming(false);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-status-paidText">Member Created Successfully</p>
          <h2 className="mt-2 text-xl font-bold text-ink">{success.fullName}</h2>
          <p className="mt-1 text-muted">BODY FLEX Member ID</p>
          <p className="text-2xl font-extrabold text-brand">{success.memberCode}</p>
          <div className="mt-6 flex gap-3">
            <button className="btn-outline flex-1" onClick={() => navigate("/admin/members")}>Members List</button>
            <button className="btn-primary flex-1" onClick={() => navigate(`/admin/members/${success._id}`)}>View Profile</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add New Member" />
      <form onSubmit={handleSubmitClick} className="space-y-6">
        <section className="card space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
              {photoPreview && <img src={photoPreview} className="h-full w-full object-cover" />}
            </div>
            <div>
              <button type="button" className="btn-outline text-sm" onClick={() => fileInputRef.current.click()}>Upload Photo</button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              <p className="mt-1 text-xs text-muted">JPG, PNG or WEBP, up to 5MB</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
            </div>
            <div>
              <label className="label">Mobile *</label>
              <input className="input" required value={form.mobile} onChange={(e) => update("mobile", e.target.value)} placeholder="10-digit mobile number" />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.dob} onChange={(e) => update("dob", e.target.value)} />
            </div>
            <div>
              <label className="label">Joining Date *</label>
              <input type="date" className="input" required value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-ink">Membership</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Membership Plan *</label>
              <select className="input" required value={form.planId} onChange={(e) => update("planId", e.target.value)}>
                <option value="">Select a plan</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                  {p.name} - {formatINR(p.fee)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fee Amount</label>
              <input type="number" min="0" className="input" placeholder={selectedPlan ? String(selectedPlan.fee) : ""} value={form.feeAmount} onChange={(e) => update("feeAmount", e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-ink">Initial Payment (optional)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Amount</label>
              <input type="number" min="0" className="input" value={form.initialAmount} onChange={(e) => update("initialAmount", e.target.value)} />
            </div>
            <div>
              <label className="label">Method</label>
              <select className="input" value={form.method} onChange={(e) => update("method", e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Reference</label>
              <input className="input" value={form.reference} onChange={(e) => update("reference", e.target.value)} />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-status-overdueText">{error}</p>}

        {confirming && (
          <div className="card border-brand-100 bg-brand-50">
            <p className="text-sm text-ink">Create this member? Please confirm the details are correct.</p>
            <div className="mt-3 flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setConfirming(false)}>Go Back</button>
              <button type="button" className="btn-primary flex-1" disabled={loading} onClick={handleConfirmCreate}>
                {loading ? "Saving..." : duplicateConfirmNeeded ? "Save Anyway" : "Confirm & Save"}
              </button>
            </div>
          </div>
        )}

        {!confirming && (
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-primary">Continue</button>
          </div>
        )}
      </form>
    </div>
  );
}
