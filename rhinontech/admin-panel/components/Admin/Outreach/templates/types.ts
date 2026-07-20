export type TemplateChannel =
  | "Email"
  | "Cold Email"
  | "LinkedIn Post"
  | "LinkedIn Video"
  | "LinkedIn Article"
  | "LinkedIn DM"
  | "LinkedIn Connection";

// Channels still creatable — DM/Connection are dead in the engine (see
// SUPPORTED_CHANNELS in backend routes/campaigns.ts) but existing templates
// using them are left alone rather than data-migrated.
export const CREATABLE_CHANNELS: TemplateChannel[] = [
  "Email",
  "Cold Email",
  "LinkedIn Post",
  "LinkedIn Article",
  "LinkedIn Video",
];

export const SOCIAL_CHANNELS: TemplateChannel[] = [
  "LinkedIn Post",
  "LinkedIn Video",
  "LinkedIn Article",
  "LinkedIn DM",
  "LinkedIn Connection",
];
export const EMAIL_CHANNELS: TemplateChannel[] = ["Email", "Cold Email"];

export const isSocialChannel = (ch?: string) => !!ch && SOCIAL_CHANNELS.includes(ch as TemplateChannel);

export const CHANNEL_COLORS: Record<string, string> = {
  Email: "bg-blue-50 text-blue-600 border-blue-100",
  "Cold Email": "bg-sky-50 text-sky-600 border-sky-100",
  "LinkedIn Post": "bg-indigo-50 text-indigo-600 border-indigo-100",
  "LinkedIn Video": "bg-violet-50 text-violet-600 border-violet-100",
  "LinkedIn Article": "bg-purple-50 text-purple-600 border-purple-100",
  "LinkedIn DM": "bg-cyan-50 text-cyan-600 border-cyan-100",
  "LinkedIn Connection": "bg-teal-50 text-teal-600 border-teal-100",
};

export interface Template {
  id: string;
  name: string;
  channel: TemplateChannel;
  subject: string;
  body: string;
  imageUrl: string;
  aiInstructions: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
}

export const EMPTY_TEMPLATE_FORM = {
  name: "",
  channel: "Email" as TemplateChannel,
  subject: "",
  body: "",
  imageUrl: "",
  aiInstructions: "",
  visibility: "PUBLIC" as "PUBLIC" | "CONNECTIONS",
  mediaTitle: "",
  mediaDescription: "",
  articleUrl: "",
};
