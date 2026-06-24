"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";

interface UserProfile {
  fullName: string;
  companyEmail: string;
  department: string;
  joiningDate: string;
  pan?: string;
  employmentType?: string;
  compensationType?: string;
  workSchedule?: string;
  remotePosition?: boolean;
  workLocation?: string;
  paymentFrequency?: string;
  basicSalary?: number;
  hra?: number;
  ta?: number;
  medicalAllowance?: number;
  otherAllowances?: number;
  pfEnabled?: boolean;
  ptAmount?: number;
  tdsAmount?: number;
  role?: { name: string };
}

const INR = (v: number) => `₹${Number(v).toLocaleString("en-IN")}`;

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value ?? <span className="text-gray-300 font-normal">—</span>}</p>
    </div>
  );
}

export function EmployeeSalaryDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("authToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasSalary = profile?.basicSalary && Number(profile.basicSalary) > 0;

  const basic   = Number(profile?.basicSalary ?? 0);
  const hra     = Number(profile?.hra ?? 0);
  const ta      = Number(profile?.ta ?? 0);
  const medical = Number(profile?.medicalAllowance ?? 0);
  const other   = Number(profile?.otherAllowances ?? 0);
  const gross   = basic + hra + ta + medical + other;
  const pf      = profile?.pfEnabled !== false ? Math.round(basic * 0.12) : 0;
  const pt      = Number(profile?.ptAmount  ?? 200);
  const tds     = Number(profile?.tdsAmount ?? 0);
  const net     = gross - pf - pt - tds;
  const annual  = gross * 12;

  const joinDate = profile?.joiningDate
    ? new Date(profile.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : undefined;

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-stone-50">
        <SubNavToggle />
        <h1 className="text-base font-semibold tracking-tight">Salary Details</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="max-w-3xl flex flex-col gap-5">

            {/* Employee info */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                  {profile?.fullName?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{profile?.fullName}</p>
                  <p className="text-sm text-gray-400">{profile?.companyEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-4">
                <Field label="Role" value={profile?.role?.name} />
                <Field label="Department" value={profile?.department} />
                <Field label="Employment Type" value={profile?.employmentType ?? "Full-Time"} />
                <Field label="Compensation Type" value={profile?.compensationType ?? "Salaried"} />
                <Field label="Joining Date" value={joinDate} />
                <Field label="Work Location" value={profile?.workLocation ?? profile?.department} />
                <Field label="Work Schedule" value={profile?.workSchedule ?? "11 AM – 8 PM (Mon–Sat)"} />
                <Field label="Payment Frequency" value={profile?.paymentFrequency ?? "Monthly"} />
                {profile?.pan && <Field label="PAN" value={profile.pan} />}
              </div>
            </div>

            {/* Salary breakdown */}
            {!hasSalary ? (
              <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                <p className="text-sm font-medium text-gray-500">Salary structure not configured</p>
                <p className="text-xs text-gray-400 mt-1">Please contact HR to set up your salary.</p>
              </div>
            ) : (
              <>
                {/* Earnings */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b">
                    <p className="font-semibold text-gray-900">Earnings (Monthly)</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { label: "Basic Salary",       value: basic   },
                        { label: "HRA",                value: hra     },
                        { label: "Transport (TA)",     value: ta      },
                        { label: "Medical Allowance",  value: medical },
                        { label: "Other Allowances",   value: other   },
                      ].map((row) => (
                        <tr key={row.label} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-600">{row.label}</td>
                          <td className="px-5 py-3 text-right font-medium">{INR(row.value)}</td>
                          <td className="px-5 py-3 text-right text-xs text-gray-400">{INR(row.value * 12)} / yr</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
                      <tr>
                        <td className="px-5 py-3">Gross</td>
                        <td className="px-5 py-3 text-right">{INR(gross)}</td>
                        <td className="px-5 py-3 text-right text-xs text-gray-500">{INR(annual)} / yr</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Deductions */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b">
                    <p className="font-semibold text-gray-900">Deductions (Monthly)</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { label: pf > 0 ? "PF (Employee 12% of Basic)" : "PF (Not applicable)", value: pf  },
                        { label: "Professional Tax",                                              value: pt  },
                        { label: "TDS",                                                           value: tds },
                      ].map((row) => (
                        <tr key={row.label} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-600">{row.label}</td>
                          <td className="px-5 py-3 text-right font-medium text-red-600">−{INR(row.value)}</td>
                          <td className="px-5 py-3 text-right text-xs text-gray-400">−{INR(row.value * 12)} / yr</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
                      <tr>
                        <td className="px-5 py-3">Total Deductions</td>
                        <td className="px-5 py-3 text-right text-red-600">−{INR(pf + pt + tds)}</td>
                        <td className="px-5 py-3 text-right text-xs text-gray-400">−{INR((pf + pt + tds) * 12)} / yr</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Net pay highlight */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 flex items-center justify-between text-white">
                  <div>
                    <p className="text-sm text-blue-100">Take-Home (Net Pay)</p>
                    <p className="text-3xl font-bold mt-0.5">{INR(net)}<span className="text-base font-normal text-blue-200"> / month</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-100">Annual</p>
                    <p className="text-base font-semibold">{INR(net * 12)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
