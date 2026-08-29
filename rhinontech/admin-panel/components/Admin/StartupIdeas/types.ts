export const STARTUP_IDEA_STATUSES = [
  "New",
  "Reviewed",
  "Contacted",
  "Qualified",
  "Converted",
  "Dropped",
] as const;

export type StartupIdeaStatus = (typeof STARTUP_IDEA_STATUSES)[number];

export interface StartupIdea {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  idea: string;
  stage?: string | null;
  budget?: string | null;
  status: StartupIdeaStatus;
  isRead: boolean;
  notes?: string | null;
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  convertedLeadId?: string | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartupIdeaListResponse {
  ideas: StartupIdea[];
  total: number;
  counts: Record<string, number>;
}

// Status pill colours, matching the tone used elsewhere in the panel.
export const STATUS_STYLES: Record<StartupIdeaStatus, string> = {
  New: "bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-400/20",
  Reviewed:
    "bg-slate-50 dark:bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-400/20",
  Contacted:
    "bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-400/20",
  Qualified:
    "bg-violet-50 dark:bg-violet-400/10 text-violet-600 dark:text-violet-300 border-violet-100 dark:border-violet-400/20",
  Converted:
    "bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-400/20",
  Dropped:
    "bg-rose-50 dark:bg-rose-400/10 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-400/20",
};
