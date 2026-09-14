import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../context/ToastContext";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/members/${id}`).then((res) => {
      const m = res.data.member;
      setForm({
        fullName: m.fullName,
        dob: m.dob ? m.dob.split("T")[0] : "",
        mobile: m.mobile,
        address: m.address || "",
      });
      setPhotoPreview(m.photoUrl ? `${import.meta.env.VITE_API_URL.replace("/api", "")}${m.photoUrl}` : null);
    });
  }, [id]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.mobile && !INDIAN_MOBILE_REGEX.test(form.mobile)) {
      setError("Please enter a valid Indian mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("mobile", form.mobile);
      if (form.dob) fd.append("dob", form.dob);
      fd.append("address", form.address);
      if (photoFile) fd.append("photo", photoFile);

      await api.put(`/members/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Member updated successfully.");
      navigate(`/admin/members/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save member. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!form) return <p className="text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Edit Member" />
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
            {photoPreview && <img src={photoPreview} className="h-full w-full object-cover" />}
          </div>
          <div>
            <button type="button" className="btn-outline text-sm" onClick={() => fileInputRef.current.click()}>Change Photo</button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>
        <div>
          <label className="label">Full Name</label>
          <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="label">Mobile</label>
          <input className="input" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        {error && <p className="text-sm text-status-overdueText">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}
