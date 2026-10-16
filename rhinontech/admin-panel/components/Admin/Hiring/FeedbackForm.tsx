"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TbStarFilled, TbStar } from "react-icons/tb";
import { hiringApi, jsonInit, inputCls, REC_LABEL, type Interview, type Recommendation } from "./shared";

export function FeedbackForm({ interview, onSaved }: { interview: Interview; onSaved: (i: Interview) => void }) {
  const [rating, setRating] = useState(interview.rating ?? 0);
  const [recommendation, setRecommendation] = useState<Recommendation | "">(interview.recommendation ?? "");
  const [feedback, setFeedback] = useState(interview.feedback ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!rating) { toast.error("Give a rating"); return; }
    if (!recommendation) { toast.error("Pick a recommendation"); return; }
    if (!feedback.trim()) { toast.error("Write a few lines of feedback"); return; }
    setSaving(true);
    const r = await hiringApi(`/interviews/${interview.id}/feedback`, jsonInit("POST", { rating, recommendation, feedback }));
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { toast.error(data.message || "Couldn't save feedback"); return; }
    toast.success("Feedback saved");
    onSaved({ ...interview, ...data });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className="text-amber-500" aria-label={`${n} stars`}>
            {n <= rating ? <TbStarFilled size={20} /> : <TbStar size={20} />}
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{rating ? `${rating}/5` : "Rate"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(REC_LABEL) as Recommendation[]).map((r) => (
          <button key={r} type="button" onClick={() => setRecommendation(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${recommendation === r ? "bg-foreground text-background border-foreground" : "border-border text-foreground/75 hover:bg-muted/40"}`}>
            {REC_LABEL[r]}
          </button>
        ))}
      </div>
      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className={inputCls}
        placeholder="Strengths, concerns, what you tested…" />
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
          {saving ? "Saving…" : "Submit feedback"}
        </button>
      </div>
    </div>
  );
}
