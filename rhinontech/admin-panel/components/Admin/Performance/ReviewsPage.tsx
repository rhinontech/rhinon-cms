"use client";

import { useCallback, useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { TbStar, TbStarFilled, TbX, TbLoader2 } from "react-icons/tb";

interface ReviewCycle {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface ReviewSubmission {
  id: string;
  type: "self" | "manager";
  status: "pending" | "submitted";
  selfRating: number | null;
  managerRating: number | null;
  selfFeedback: string | null;
  managerFeedback: string | null;
  strengths: string | null;
  improvements: string | null;
  cycle?: ReviewCycle | null;
  reviewee?: { id: string; fullName: string; department: string } | null;
}

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn("text-xl transition-colors", readOnly ? "cursor-default" : "cursor-pointer hover:scale-110")}
        >
          {(value ?? 0) >= n ? (
            <TbStarFilled className="text-amber-400" />
          ) : (
            <TbStar className="text-gray-300" />
          )}
        </button>
      ))}
      {value && <span className="ml-1 text-sm text-gray-500">{value}/5</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
      status === "submitted" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
    )}>
      {status === "submitted" ? "Submitted" : "Pending"}
    </span>
  );
}

export function ReviewsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [selfReviews, setSelfReviews] = useState<ReviewSubmission[]>([]);
  const [managerReviews, setManagerReviews] = useState<ReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewSubmission | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    selfRating: null as number | null,
    managerRating: null as number | null,
    selfFeedback: "",
    managerFeedback: "",
    strengths: "",
    improvements: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ selfReviews: ReviewSubmission[]; managerReviews: ReviewSubmission[] }>("/performance/reviews");
      setSelfReviews(data.selfReviews);
      setManagerReviews(data.managerReviews);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openSubmission(sub: ReviewSubmission) {
    // Load full details
    try {
      const full = await apiFetch<ReviewSubmission>(`/performance/reviews/${sub.id}`);
      setSelected(full);
      setForm({
        selfRating: full.selfRating,
        managerRating: full.managerRating,
        selfFeedback: full.selfFeedback ?? "",
        managerFeedback: full.managerFeedback ?? "",
        strengths: full.strengths ?? "",
        improvements: full.improvements ?? "",
      });
    } catch {
      setSelected(sub);
    }
  }

  function closeAside() {
    setSelected(null);
  }

  async function handleSubmit() {
    if (!selected) return;
    setSaving(true);
    try {
      const body = selected.type === "self"
        ? { selfRating: form.selfRating, selfFeedback: form.selfFeedback, strengths: form.strengths, improvements: form.improvements }
        : { managerRating: form.managerRating, managerFeedback: form.managerFeedback, strengths: form.strengths, improvements: form.improvements };
      await apiFetch(`/performance/reviews/${selected.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      closeAside();
      await load();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const isReadOnly = selected?.status === "submitted";

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn("flex min-h-0 flex-col h-full w-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <span className="text-lg font-semibold tracking-tight">My Reviews</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <TbLoader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : (
            <>
              {/* Self Assessments */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">My Self-Assessments</h3>
                {selfReviews.length === 0 ? (
                  <div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
                    <p className="text-sm text-gray-400">No self-assessments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selfReviews.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => openSubmission(sub)}
                        className="w-full text-left rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{sub.cycle?.name ?? "—"}</p>
                            <p className="text-xs text-gray-400 mt-0.5 capitalize">{sub.cycle?.type}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {sub.selfRating && <StarRating value={sub.selfRating} readOnly />}
                            <StatusBadge status={sub.status} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Manager Reviews Given */}
              {managerReviews.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Manager Reviews I've Given</h3>
                  <div className="space-y-2">
                    {managerReviews.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => openSubmission(sub)}
                        className="w-full text-left rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{sub.reviewee?.fullName ?? "—"}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{sub.cycle?.name} · {sub.reviewee?.department}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {sub.managerRating && <StarRating value={sub.managerRating} readOnly />}
                            <StatusBadge status={sub.status} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        selected ? "w-[42%]" : "w-0"
      )}>
          {selected && (
            <>
              <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
                <div className="flex gap-4 border-b border-transparent -mb-px">
                  <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
                    {selected.type === "self" ? "Self Assessment" : "Manager Review"}
                  </p>
                </div>
                <button onClick={closeAside} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <TbX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-lg border border-gray-100 p-3 space-y-1">
                  <p className="text-xs text-gray-400">Cycle</p>
                  <p className="font-semibold text-gray-900">{selected.cycle?.name ?? "—"}</p>
                </div>
                {selected.reviewee && (
                  <div className="rounded-lg border border-gray-100 p-3 space-y-1">
                    <p className="text-xs text-gray-400">Reviewee</p>
                    <p className="font-semibold text-gray-900">{selected.reviewee.fullName}</p>
                    <p className="text-xs text-gray-400">{selected.reviewee.department}</p>
                  </div>
                )}

                {/* Rating */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">
                    {selected.type === "self" ? "Self Rating" : "Manager Rating"}
                  </label>
                  {isReadOnly ? (
                    <StarRating value={selected.type === "self" ? selected.selfRating : selected.managerRating} readOnly />
                  ) : (
                    <StarRating
                      value={selected.type === "self" ? form.selfRating : form.managerRating}
                      onChange={(v) =>
                        setForm((f) => selected.type === "self" ? { ...f, selfRating: v } : { ...f, managerRating: v })
                      }
                    />
                  )}
                </div>

                {/* Feedback */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">
                    {selected.type === "self" ? "Self Feedback" : "Manager Feedback"}
                  </label>
                  {isReadOnly ? (
                    <div className="rounded-lg border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {(selected.type === "self" ? selected.selfFeedback : selected.managerFeedback) || "—"}
                    </div>
                  ) : (
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      value={selected.type === "self" ? form.selfFeedback : form.managerFeedback}
                      onChange={(e) =>
                        setForm((f) => selected.type === "self" ? { ...f, selfFeedback: e.target.value } : { ...f, managerFeedback: e.target.value })
                      }
                      placeholder="Write your feedback…"
                    />
                  )}
                </div>

                {/* Strengths */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Strengths</label>
                  {isReadOnly ? (
                    <div className="rounded-lg border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {selected.strengths || "—"}
                    </div>
                  ) : (
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      value={form.strengths}
                      onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
                      placeholder="Key strengths…"
                    />
                  )}
                </div>

                {/* Improvements */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Areas for Improvement</label>
                  {isReadOnly ? (
                    <div className="rounded-lg border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {selected.improvements || "—"}
                    </div>
                  ) : (
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      value={form.improvements}
                      onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))}
                      placeholder="Areas to improve…"
                    />
                  )}
                </div>

                {!isReadOnly && (
                  <button
                    onClick={handleSubmit}
                    disabled={saving || (selected.type === "self" ? !form.selfRating : !form.managerRating)}
                    className="w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Submitting…" : "Submit Review"}
                  </button>
                )}

                {isReadOnly && (
                  <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700 text-center font-medium">
                    Review submitted
                  </div>
                )}
              </div>
            </>
          )}
      </aside>
    </div>
  );
}
