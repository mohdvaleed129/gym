import { useEffect, useState } from "react";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export default function Settings() {
  const { showToast } = useToast();
  const { admin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    api.get("/settings").then((res) => setSettings(res.data.settings));
  }, []);

  function update(field, value) {
    setSettings((s) => ({ ...s, [field]: value }));
  }
  function updateReminder(field, value) {
    setSettings((s) => ({ ...s, reminders: { ...s.reminders, [field]: value } }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", settings);
      showToast("Settings updated successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to update settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError("");
    try {
      await api.patch("/auth/update-password", pwForm);
      showToast("Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwError(err.response?.data?.message || "Unable to change password.");
    }
  }

  if (!settings) return <p className="text-muted">Loading settings...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" />

      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="font-semibold text-ink">Gym Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Gym Name</label><input className="input" value={settings.gymName} onChange={(e) => update("gymName", e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="input" value={settings.phone} onChange={(e) => update("phone", e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input" value={settings.email} onChange={(e) => update("email", e.target.value)} /></div>
          <div><label className="label">Opening Hours</label><input className="input" value={settings.openingHours} onChange={(e) => update("openingHours", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={settings.address} onChange={(e) => update("address", e.target.value)} /></div>
        </div>

        <h2 className="pt-2 font-semibold text-ink">Billing Settings</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Default Duration Type</label>
            <select className="input" value={settings.defaultBillingDurationType} onChange={(e) => update("defaultBillingDurationType", e.target.value)}>
              <option value="days">Days</option>
              <option value="months">Months</option>
            </select>
          </div>
          <div><label className="label">Default Duration</label><input type="number" min="1" className="input" value={settings.defaultBillingDurationValue} onChange={(e) => update("defaultBillingDurationValue", Number(e.target.value))} /></div>
          <div><label className="label">Default Fee (₹)</label><input type="number" min="0" className="input" value={settings.defaultFee} onChange={(e) => update("defaultFee", Number(e.target.value))} /></div>
        </div>

        <h2 className="pt-2 font-semibold text-ink">Reminder Settings</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={settings.reminders.beforeEnabled} onChange={(e) => updateReminder("beforeEnabled", e.target.checked)} />
            Send reminder <input type="number" min="1" className="input w-16" value={settings.reminders.beforeDays} onChange={(e) => updateReminder("beforeDays", Number(e.target.value))} /> days before due date
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={settings.reminders.dueEnabled} onChange={(e) => updateReminder("dueEnabled", e.target.checked)} />
            Send reminder on due date
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={settings.reminders.afterEnabled} onChange={(e) => updateReminder("afterEnabled", e.target.checked)} />
            Send reminder <input type="number" min="1" className="input w-16" value={settings.reminders.afterDays} onChange={(e) => updateReminder("afterDays", Number(e.target.value))} /> days after due date (overdue)
          </label>
          <div>
            <label className="label">Preferred Channel</label>
            <select className="input max-w-[180px]" value={settings.reminders.preferredChannel} onChange={(e) => updateReminder("preferredChannel", e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
      </form>

      <form onSubmit={handlePasswordChange} className="card space-y-4">
        <h2 className="font-semibold text-ink">Admin Profile</h2>
        <p className="text-sm text-muted">{admin?.name} &middot; {admin?.email}</p>
        <div>
          <label className="label">Current Password</label>
          <input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        </div>
        {pwError && <p className="text-sm text-status-overdueText">{pwError}</p>}
        <button className="btn-outline">Change Password</button>
      </form>
    </div>
  );
}
