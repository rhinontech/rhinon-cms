"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TbEye, TbEyeOff, TbCheck, TbX } from "react-icons/tb";

type Stage = "loading" | "invalid" | "form" | "success";

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <span className={`flex items-center gap-1 text-xs ${met ? "text-green-600" : "text-gray-400"}`}>
      {met ? <TbCheck size={12} /> : <TbX size={12} />}
      {text}
    </span>
  );
}

export function OnboardingSetup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("loading");
  const [fullName, setFullName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = rules.length && rules.upper && rules.number;

  useEffect(() => {
    if (!token) { setStage("invalid"); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/onboard/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setFullName(data.fullName);
        setCompanyEmail(data.companyEmail);
        setStage("form");
      })
      .catch(() => setStage("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) { setError("Password does not meet requirements."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Something went wrong.");
        return;
      }
      setStage("success");
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 mb-4">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <p className="text-sm text-gray-500">Rhinon Tech · Admin Panel</p>
        </div>

        {stage === "loading" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-400">Verifying your link...</p>
          </div>
        )}

        {stage === "invalid" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <TbX size={22} className="text-red-500" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Link expired or invalid</p>
            <p className="text-sm text-gray-500">This onboarding link has expired or already been used. Contact your admin to resend the invite.</p>
          </div>
        )}

        {stage === "form" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-zinc-900 px-6 py-5">
              <p className="text-white font-semibold text-lg">Welcome, {firstName}!</p>
              <p className="text-zinc-400 text-sm mt-0.5">Set your password to activate your account</p>
            </div>
            <div className="px-6 py-5">
              {/* Account info */}
              <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 mb-5">
                <p className="text-xs text-gray-400 mb-1">Your company email</p>
                <p className="text-sm font-semibold text-gray-900">{companyEmail}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      placeholder="Create a strong password"
                      required
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="px-3 text-gray-400 hover:text-gray-600">
                      {showPw ? <TbEyeOff size={16} /> : <TbEye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <PasswordRule met={rules.length} text="8+ characters" />
                      <PasswordRule met={rules.upper} text="Uppercase letter" />
                      <PasswordRule met={rules.number} text="Number" />
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      placeholder="Re-enter your password"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="px-3 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <TbEyeOff size={16} /> : <TbEye size={16} />}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-500 mt-0.5">Passwords do not match</p>
                  )}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || !passwordValid || password !== confirm}
                  className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Setting up..." : "Activate Account"}
                </button>
              </form>
            </div>
          </div>
        )}

        {stage === "success" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-green-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <TbCheck size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Account activated!</p>
                  <p className="text-green-100 text-sm">You're all set</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">Your account is ready. Sign in with your company email to get started.</p>
              <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 mb-5">
                <p className="text-xs text-gray-400 mb-1">Login with</p>
                <p className="text-sm font-semibold text-gray-900">{companyEmail}</p>
              </div>
              <button
                onClick={() => router.push(`/auth/login?email=${encodeURIComponent(companyEmail)}`)}
                className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                Go to Login →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
