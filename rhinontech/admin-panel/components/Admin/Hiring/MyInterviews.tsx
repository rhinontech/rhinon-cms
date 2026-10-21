"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TbFileText, TbExternalLink, TbBrandLinkedin, TbStarFilled } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { hiringApi, fmtDateTime, openResume, REC_LABEL, REC_STYLE, type Interview } from "./shared";
import { FeedbackForm } from "./FeedbackForm";

export function MyInterviews() {
  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    hiringApi("/my-interviews").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const pending = items.filter((i) => i.status === "scheduled");
  const done = items.filter((i) => i.status !== "scheduled");

  const row = (i: Interview) => (
    <div key={i.id} className="glass-card-solid rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{i.candidate?.fullName} <span className="text-muted-foreground font-normal">· {i.roundName}</span></p>
          <p className="text-xs text-muted-foreground">{i.candidate?.opening?.title} · {fmtDateTime(i.scheduledAt)} · {i.durationMins} min</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {i.recommendation && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REC_STYLE[i.recommendation]}`}>{REC_LABEL[i.recommendation]}</span>}
          {i.rating && <span className="flex items-center gap-0.5 text-xs text-amber-600"><TbStarFilled size={12} /> {i.rating}</span>}
          <button onClick={async () => { if (!(await openResume(i.candidateId))) toast.error("Couldn't open resume"); }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-muted/40"><TbFileText size={13} /> Resume</button>
          {i.candidate?.linkedinUrl && (
            <a href={i.candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-muted/40"><TbBrandLinkedin size={13} /> LinkedIn</a>
          )}
          {i.meetingLink && i.status === "scheduled" && (
            <a href={i.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-muted/40"><TbExternalLink size={13} /> Join</a>
          )}
        </div>
      </div>
      {i.feedback && open !== i.id && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{i.feedback}</p>}
      {open === i.id ? (
        <FeedbackForm interview={i} onSaved={() => { setOpen(null); load(); }} />
      ) : i.status !== "cancelled" && i.status !== "no_show" && (
        <button onClick={() => setOpen(i.id)} className="text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline">
          {i.feedback ? "Edit feedback" : "Give feedback"}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full glass-panel rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b border-border glass-header shrink-0">
        <SubNavToggle />
        <div>
          <h1 className="text-base font-semibold tracking-tight">My interviews</h1>
          <p className="text-xs text-muted-foreground">Interviews you&apos;re taking, and your feedback</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <div className="glass-card-solid rounded-xl p-12 text-center text-muted-foreground text-sm">No interviews assigned to you.</div>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Awaiting feedback ({pending.length})</p>
              {pending.length === 0 ? <p className="text-sm text-muted-foreground">All caught up.</p> : pending.map(row)}
            </div>
            {done.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Done</p>
                {done.map(row)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
