"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MailX,
  CheckCircle2,
  AlertCircle,
  Mail,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { submitUnsubscribe } from "@/lib/api";

const PRESET_REASONS = [
  "I no longer want to receive these emails",
  "The content is not relevant to me",
  "I receive too many emails",
  "I never signed up for this mailing list",
  "The content is not what I expected",
  "Other",
];

export default function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam.trim());
      setIsEditingEmail(false);
    } else {
      setIsEditingEmail(true);
    }
  }, [emailParam]);

  const finalReason =
    selectedReason === "Other" ? customReason.trim() : selectedReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!selectedReason) {
      setError("Please select a reason for unsubscribing.");
      return;
    }

    if (selectedReason === "Other" && !customReason.trim()) {
      setError("Please specify your reason in the text box below.");
      return;
    }

    setLoading(true);

    try {
      await submitUnsubscribe({
        email: trimmedEmail,
        reason: finalReason,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to process unsubscribe request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-neutral-100 flex flex-col justify-center items-center px-4 py-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-indigo-600/10 blur-[110px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0D1117]/80 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 sm:p-9 shadow-2xl shadow-black/60"
            >
              {/* Header Badge & Title */}
              <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-neutral-400 font-medium mb-3">
                <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <MailX className="w-4 h-4" />
                </span>
                <span>Email Preferences</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
                Unsubscribe from emails
              </h1>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                We are sorry to see you go. Please confirm your email and let us know why you would like to unsubscribe so we can improve.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Section */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>

                  {isEditingEmail ? (
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@domain.com"
                        className="w-full bg-[#161B22] border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-colors"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-[#161B22] border border-neutral-800 px-4 py-3 rounded-xl">
                      <div className="flex items-center space-x-3 truncate">
                        <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm font-medium text-neutral-200 truncate">
                          {email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingEmail(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0 ml-3 underline underline-offset-2 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">
                    Reason for unsubscribing <span className="text-red-400">*</span>
                  </label>

                  <div className="space-y-2.5">
                    {PRESET_REASONS.map((reason) => {
                      const isSelected = selectedReason === reason;
                      return (
                        <label
                          key={reason}
                          onClick={() => setSelectedReason(reason)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-600/10 border-blue-500/50 text-white shadow-sm"
                              : "bg-[#161B22]/50 border-neutral-800/80 hover:bg-[#161B22] hover:border-neutral-700 text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3 text-sm">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "border-blue-400 bg-blue-500"
                                  : "border-neutral-600 bg-transparent"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="font-normal">{reason}</span>
                          </div>
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-blue-400"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* "Other" free-text input */}
                  <AnimatePresence>
                    {selectedReason === "Other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 overflow-hidden"
                      >
                        <textarea
                          rows={3}
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Please tell us a bit more about why you are unsubscribing..."
                          className="w-full bg-[#161B22] border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-colors resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error Alert */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs leading-relaxed"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-medium py-3 px-5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        <span>Unsubscribe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-2 text-xs text-neutral-500 pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Your request is processed immediately.</span>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Success confirmation card */
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0D1117]/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 sm:p-10 text-center shadow-2xl shadow-black/60"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
                You have been unsubscribed
              </h2>

              <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
                Your email <strong className="text-neutral-200 font-medium">{email}</strong> has been removed from our communications list. You won&apos;t receive marketing emails from us.
              </p>

              <div className="bg-[#161B22] border border-neutral-800/80 rounded-xl p-4 mb-8 text-left text-xs text-neutral-400 space-y-1.5">
                <div className="text-neutral-300 font-medium flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Feedback recorded</span>
                </div>
                <p className="text-neutral-400 italic">
                  &ldquo;{finalReason}&rdquo;
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span>Return to Homepage</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
