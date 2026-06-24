"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { WorkSchedulePicker } from "@/components/Admin/Common/WorkSchedulePicker";
import {
  TbPencil, TbCheck, TbX, TbLoader2, TbAlertCircle,
  TbMail, TbBuildingSkyscraper, TbCalendar, TbShield,
} from "react-icons/tb";

interface UserProfile {
  id: string;
  fullName: string;
  personalEmail: string;
  companyEmail: string;
  department: string;
  status: string;
  joiningDate: string;
  pan?: string;
  employmentType?: string;
  compensationType?: string;
  workSchedule?: string;
  remotePosition?: boolean;
  workLocation?: string;
  paymentFrequency?: string;
  role?: { name: string; slug: string };
}

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600", "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-violet-500 to-purple-600",
];
const avatarGradient = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-all">{value ?? <span className="text-gray-300 font-normal">—</span>}</p>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", disabled = false, hint }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  type?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        type={type} name={name} value={value}
        onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function ProfileInfo() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch<UserProfile>("/auth/me")
      .then((data) => { setProfile(data); setForm(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => {
    if (profile) setForm({ ...profile });
    setError(""); setSuccess(false); setEditing(true);
  };
  const cancelEdit = () => { if (profile) setForm({ ...profile }); setError(""); setEditing(false); };

  const save = async () => {
    setSaving(true); setError(""); setSuccess(false);
    try {
      const updated = await apiFetch<UserProfile>("/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          fullName: form.fullName, personalEmail: form.personalEmail,
          pan: form.pan, employmentType: form.employmentType,
          compensationType: form.compensationType, workSchedule: form.workSchedule,
          remotePosition: form.remotePosition, workLocation: form.workLocation,
          paymentFrequency: form.paymentFrequency,
        }),
      });
      setProfile(updated); setForm(updated); setEditing(false);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const joinDate = profile?.joiningDate
    ? new Date(profile.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-5 border-b bg-stone-50">
        <div className="flex items-center gap-4">
          <SubNavToggle />
          <h1 className="text-xl font-bold tracking-tight">Personal Information</h1>
        </div>
        {!loading && profile && (
          !editing ? (
            <button onClick={startEdit} className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              <TbPencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50">
                {saving ? <TbLoader2 size={14} className="animate-spin" /> : <TbCheck size={14} />} Save
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                <TbX size={14} /> Cancel
              </button>
            </div>
          )
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : !profile ? (
          <p className="text-sm text-gray-400">Failed to load profile.</p>
        ) : (
          <div className="max-w-3xl space-y-5">
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(profile.fullName)} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                  {initials(profile.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{profile.fullName}</h2>
                      <p className="text-sm text-gray-500">{profile.role?.name ?? "—"}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${profile.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {profile.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><TbMail size={12} /> {profile.companyEmail}</span>
                    <span className="flex items-center gap-1.5"><TbBuildingSkyscraper size={12} /> {profile.department}</span>
                    <span className="flex items-center gap-1.5"><TbCalendar size={12} /> Joined {joinDate}</span>
                    <span className="flex items-center gap-1.5"><TbShield size={12} /> {profile.employmentType ?? "Full-Time"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <TbAlertCircle size={15} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <TbCheck size={15} /> Profile updated successfully.
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-xl border border-gray-200 w-full p-6">
              {!editing ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-5">
                  <Field label="Full Name"         value={profile.fullName} />
                  <Field label="Personal Email"    value={profile.personalEmail} />
                  <Field label="Company Email"     value={profile.companyEmail} />
                  <Field label="Department"        value={profile.department} />
                  <Field label="Role"              value={profile.role?.name} />
                  <Field label="Joining Date"      value={joinDate} />
                  <Field label="PAN"               value={profile.pan} />
                  <Field label="Employment Type"   value={profile.employmentType ?? "Full-Time"} />
                  <Field label="Compensation Type" value={profile.compensationType ?? "Salaried"} />
                  <Field label="Work Schedule"     value={profile.workSchedule ?? "11 AM – 8 PM (Mon–Sat)"} />
                  <Field label="Work Location"     value={profile.workLocation} />
                  <Field label="Remote Position"   value={profile.remotePosition ? "Yes" : "No"} />
                  <Field label="Payment Frequency" value={profile.paymentFrequency ?? "Monthly"} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <InputField label="Full Name *" name="fullName" value={form.fullName ?? ""} onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} />
                  <InputField label="Personal Email" name="personalEmail" type="email" value={form.personalEmail ?? ""} onChange={(v) => setForm((f) => ({ ...f, personalEmail: v }))} />
                  <InputField label="Company Email" name="companyEmail" value={profile.companyEmail} onChange={() => {}} disabled hint="Cannot be changed" />
                  <InputField label="Department" name="department" value={profile.department} onChange={() => {}} disabled hint="Set by admin" />
                  <InputField label="PAN" name="pan" value={form.pan ?? ""} onChange={(v) => setForm((f) => ({ ...f, pan: v.toUpperCase() }))} hint="10-character PAN number" />
                  <InputField label="Work Location" name="workLocation" value={form.workLocation ?? ""} onChange={(v) => setForm((f) => ({ ...f, workLocation: v }))} />

                  {(["employmentType", "compensationType", "paymentFrequency"] as const).map((key) => {
                    const opts: Record<string, string[]> = {
                      employmentType:   ["Full-Time", "Part-Time", "Contract", "Intern"],
                      compensationType: ["Salaried", "Hourly", "Contract"],
                      paymentFrequency: ["Monthly", "Bi-Weekly", "Weekly"],
                    };
                    const labels: Record<string, string> = {
                      employmentType:   "Employment Type",
                      compensationType: "Compensation Type",
                      paymentFrequency: "Payment Frequency",
                    };
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">{labels[key]}</label>
                        <select
                          value={(form[key] as string) ?? opts[key][0]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {opts[key].map((v) => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                    );
                  })}

                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Work Schedule</label>
                    <WorkSchedulePicker
                      value={form.workSchedule ?? "11 AM – 8 PM (Mon–Sat)"}
                      onChange={(v) => setForm((f) => ({ ...f, workSchedule: v }))}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-500">Remote Position</label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, remotePosition: !f.remotePosition }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${form.remotePosition ? "bg-stone-900" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.remotePosition ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className="text-sm text-gray-500">{form.remotePosition ? "Yes" : "No"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
