import type { IconType } from "react-icons";
import { TbBolt, TbBook2, TbChecklist, TbSpeakerphone, TbSwitch3 } from "react-icons/tb";

/**
 * The five approved Rhinon Labs LinkedIn post types. Mirrors
 * backend/src/config/linkedInPlaybook.ts — keep the ids in sync.
 */
export const POST_TYPES = ["STORYTELLING", "FRAMEWORK", "CONTRARIAN", "CASE_STUDY", "DIRECT_OFFER"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_AUDIENCES = ["SMB_OPERATIONS", "ASPIRING_FOUNDER"] as const;
export type PostAudience = (typeof POST_AUDIENCES)[number];

export interface PostTypeMeta {
  id: PostType;
  n: number;
  label: string;
  icon: IconType;
  /** What the type does for the reader — shown in the composer. */
  does: string;
  /** What it earns you — shown in the composer. */
  gets: string;
  objective: string;
  /** The structure the AI is told to follow, shown as a checklist on the draft. */
  structure: string[];
  /** Named avoid-rule, where the guide has one. */
  avoid?: string;
  /** Tailwind classes for the type chip. */
  chip: string;
  dot: string;
}

export const POST_TYPE_META: Record<PostType, PostTypeMeta> = {
  STORYTELLING: {
    id: "STORYTELLING",
    n: 1,
    label: "Storytelling",
    icon: TbBook2,
    does: "Names a problem your buyer is living with, so they feel understood before you sell them anything.",
    gets: "Saves, shares, and inbound from people who feel seen.",
    objective: "awareness",
    structure: [
      "Specific hook — an observation, not a platitude",
      "The situation: who, how often, where the friction was",
      "What the problem actually cost",
      "The lesson underneath it",
      "What another company can take from it",
      "One soft question as the CTA",
    ],
    avoid: "Invented clients, conversations or numbers. A story that is really just a pitch.",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  FRAMEWORK: {
    id: "FRAMEWORK",
    n: 2,
    label: "Framework",
    icon: TbChecklist,
    does: "Hands over a process people can use today. Expertise gets demonstrated, so nobody has to take your word for it.",
    gets: "Trust from anyone who implements it — and they come back for the next one.",
    objective: "expertise",
    structure: [
      "Hook naming the decision the framework resolves",
      "Name the framework and its number of steps",
      "Steps that work without you",
      "A worked example",
      "A final recommendation",
      "Save / apply / forward CTA",
    ],
    avoid: "Fake proprietary frameworks. Holding back the useful half to force a call.",
    chip: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  CONTRARIAN: {
    id: "CONTRARIAN",
    n: 3,
    label: "Contrarian",
    icon: TbSwitch3,
    does: "Contradicts what your industry repeats, which stops the scroll and starts an argument in the comments.",
    gets: "A point of view people remember you for.",
    objective: "discussion",
    structure: [
      "The position, stated plainly",
      "Name the accepted wisdom first",
      "Why the common approach fails",
      "Your alternative",
      "Proof — a number or a story",
      "An open business question",
    ],
    avoid: "Controversy for its own sake — it reads as bait and it costs you credibility.",
    chip: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  CASE_STUDY: {
    id: "CASE_STUDY",
    n: 4,
    label: "Case Study",
    icon: TbBolt,
    does: 'Moves people from "sounds good in theory" to "this actually works".',
    gets: "Proof that does the selling on your behalf.",
    objective: "proof",
    structure: [
      "The starting point, in numbers where you have them",
      "The problem",
      "What you actually built or changed",
      "Enough process to be credible",
      "The verified outcome",
      "The transferable lesson",
    ],
    avoid: "Any metric, timeline or quote that was not supplied as a verified fact.",
    chip: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  DIRECT_OFFER: {
    id: "DIRECT_OFFER",
    n: 5,
    label: "Direct Offer",
    icon: TbSpeakerphone,
    does: "Asks for the business, plainly.",
    gets: "Conversion from an audience already warmed up by everything before.",
    objective: "conversion",
    structure: [
      "The problem they are living with",
      "What Rhinon Labs builds, stated explicitly",
      "Who it is for",
      "The business outcome, not the technology",
      "One clear next step, nothing buried",
    ],
    avoid: "Multiple competing CTAs. Posting these more than roughly one in five.",
    chip: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-400/25 dark:bg-pink-400/10 dark:text-pink-300",
    dot: "bg-pink-500",
  },
};

export const POST_TYPE_LIST = POST_TYPES.map((t) => POST_TYPE_META[t]);

export const AUDIENCE_META: Record<PostAudience, { label: string; description: string }> = {
  SMB_OPERATIONS: {
    label: "SMBs & operations leaders",
    description: "Founders, CEOs, COOs and ops managers drowning in manual work and tool sprawl.",
  },
  ASPIRING_FOUNDER: {
    label: "Aspiring founders",
    description: "Non-technical founders and early teams who need an idea turned into an MVP.",
  },
};

/**
 * The guide's cadence rule: Direct Offers should be roughly one post in four or five.
 * Measured over the most recent posts so an old backlog doesn't hide a current problem.
 */
export const OFFER_RATIO_WINDOW = 10;
export const MAX_OFFER_RATIO = 0.25;

export function offerRatio(types: (PostType | null | undefined)[]): { offers: number; total: number; ratio: number; overweight: boolean } {
  const recent = types.filter(Boolean).slice(0, OFFER_RATIO_WINDOW) as PostType[];
  const offers = recent.filter((t) => t === "DIRECT_OFFER").length;
  const total = recent.length;
  const ratio = total ? offers / total : 0;
  return { offers, total, ratio, overweight: total >= 4 && ratio > MAX_OFFER_RATIO };
}
