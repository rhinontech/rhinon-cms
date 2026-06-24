"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbLock, TbCheck, TbLoader2, TbAlertCircle, TbEye, TbEyeOff } from "react-icons/tb";

interface UserProfile {
  id: string;
  fullName: string;
  companyEmail: string;
  status: string;
  role?: { name: string };
}

function PasswordField({ label, value, onChange, show, onToggle, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <TbEyeOff size={15} /> : <TbEye size={15} />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value ?? <span className="text-gray-300 font-normal">—</span>}</p>
    </div>
  );
}

export function ProfileSecurity() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch<UserProfile>("/auth/me").then(setProfile).catch(() => {});
  }, []);

  const changePassword = async () => {
    setError("");
    if (!form.current || !form.next || !form.confirm) { setError("All fields are required"); return; }
    if (form.next !== form.confirm) { setError("New passwords do not match"); return; }
    if (form.next.length < 8) { setError("New password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      await apiFetch("/auth/me/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      setForm({ current: "", next: "", confirm: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to change password");
    } finally { setSaving(false); }
  };

  const toggle = (key: keyof typeof show) => setShow((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-50">
        <SubNavToggle />
        <h1 className="text-xl font-bold tracking-tight">Security</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-5">

          {/* Change password */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b">
              <p className="font-semibold text-gray-900">Change Password</p>
              <p className="text-xs text-gray-400 mt-0.5">Use a strong password you don't use elsewhere.</p>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <TbAlertCircle size={15} /> {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <TbCheck size={15} /> Password changed successfully.
                </div>
              )}
              <PasswordField
                label="Current Password"
                value={form.current}
                onChange={(v) => setForm((f) => ({ ...f, current: v }))}
                show={show.current}
                onToggle={() => toggle("current")}
              />
              <PasswordField
                label="New Password"
                value={form.next}
                onChange={(v) => setForm((f) => ({ ...f, next: v }))}
                show={show.next}
                onToggle={() => toggle("next")}
                hint="Minimum 8 characters"
              />
              <PasswordField
                label="Confirm New Password"
                value={form.confirm}
                onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
                show={show.confirm}
                onToggle={() => toggle("confirm")}
              />
              <button
                onClick={changePassword}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 mt-2"
              >
                {saving ? <TbLoader2 size={15} className="animate-spin" /> : <TbLock size={15} />}
                {saving ? "Changing…" : "Change Password"}
              </button>
            </div>
          </div>

          {/* Account information (read-only) */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b">
              <p className="font-semibold text-gray-900">Account Information</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-5">
              <Field label="Full Name"     value={profile?.fullName} />
              <Field label="Company Email" value={profile?.companyEmail} />
              <Field label="Role"          value={profile?.role?.name} />
              <Field label="Status"        value={profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : undefined} />
              <Field label="User ID"       value={profile?.id ? `#${profile.id.slice(0, 8).toUpperCase()}` : undefined} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
