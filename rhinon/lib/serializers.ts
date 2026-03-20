import type {
  AiActivity,
  Campaign,
  Lead,
  SocialPost,
  SystemHealthResponse,
  Template,
  Blog,
  User,
} from "./types";

function toId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toString === "function") return value.toString();
  return String(value);
}

function toOptionalId(value: any): string | null {
  return value ? toId(value) : null;
}

function toIso(value: any): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function toOptionalIso(value: any): string | undefined {
  return value ? toIso(value) : undefined;
}

export function serializeLead(lead: any): Lead {
  return {
    id: toId(lead?._id ?? lead?.id),
    name: lead?.name ?? "",
    company: lead?.company ?? "",
    title: lead?.title ?? "",
    email: lead?.email ?? "",
    linkedinUrl: lead?.linkedinUrl ?? undefined,
    status: lead?.status ?? "New",
    campaignId: toOptionalId(lead?.campaignId),
    aiDraft: lead?.aiDraft ?? undefined,
    source: lead?.source ?? "Manual",
    metadata: lead?.metadata,
    addedAt: toIso(lead?.addedAt),
    lastActivityAt: toOptionalIso(lead?.lastActivityAt),
  };
}

export function serializeCampaign(campaign: any): Campaign {
  return {
    id: toId(campaign?._id ?? campaign?.id),
    name: campaign?.name ?? "",
    channel: campaign?.channel ?? "Email",
    templateId: toOptionalId(campaign?.templateId),
    stage: campaign?.stage ?? "Draft",
    leadsProcessed: Number(campaign?.leadsProcessed ?? 0),
    leadsTotal: Number(campaign?.leadsTotal ?? 0),
    dailyLimit: Number(campaign?.dailyLimit ?? 0),
    mediaUrl: campaign?.mediaUrl ?? undefined,
    aiDraft: campaign?.aiDraft ?? undefined,
    visibility: campaign?.visibility ?? undefined,
    mediaTitle: campaign?.mediaTitle ?? undefined,
    mediaDescription: campaign?.mediaDescription ?? undefined,
    articleUrl: campaign?.articleUrl ?? undefined,
    platformPostId: campaign?.platformPostId ?? undefined,
    socialStats: campaign?.socialStats
      ? {
          likes: campaign.socialStats.likes ?? 0,
          comments: campaign.socialStats.comments ?? 0,
          shares: campaign.socialStats.shares ?? 0,
          impressions: campaign.socialStats.impressions ?? 0,
          lastUpdated: toOptionalIso(campaign.socialStats.lastUpdated),
        }
      : undefined,
    startDate: toIso(campaign?.startDate),
    createdAt: toIso(campaign?.createdAt),
    updatedAt: toIso(campaign?.updatedAt),
  };
}

export function serializeTemplate(template: any): Template {
  return {
    id: toId(template?._id ?? template?.id),
    name: template?.name ?? "",
    channel: template?.channel ?? "Cold Email",
    subject: template?.subject ?? undefined,
    body: template?.body ?? "",
    aiInstructions: template?.aiInstructions ?? "",
    mediaUrl: template?.mediaUrl ?? undefined,
    visibility: template?.visibility ?? undefined,
    mediaTitle: template?.mediaTitle ?? undefined,
    mediaDescription: template?.mediaDescription ?? undefined,
    articleUrl: template?.articleUrl ?? undefined,
    createdAt: toIso(template?.createdAt),
    updatedAt: toIso(template?.updatedAt),
  };
}

export function serializeSocialPost(post: any): SocialPost {
  return {
    id: toId(post?._id ?? post?.id),
    name: post?.name ?? undefined,
    title: post?.title ?? "",
    content: post?.content ?? "",
    channel: post?.channel ?? "LinkedIn Post",
    status: post?.status ?? "Draft",
    scheduledDate: toOptionalIso(post?.scheduledDate),
    mediaUrl: post?.mediaUrl ?? undefined,
    mediaTitle: post?.mediaTitle ?? undefined,
    mediaDescription: post?.mediaDescription ?? undefined,
    articleUrl: post?.articleUrl ?? undefined,
    slug: post?.slug ?? undefined,
    visibility: post?.visibility ?? "PUBLIC",
    aiInstructions: post?.aiInstructions ?? undefined,
    platformPostId: post?.platformPostId ?? undefined,
    socialStats: post?.socialStats
      ? {
          likes: post.socialStats.likes ?? 0,
          comments: post.socialStats.comments ?? 0,
          shares: post.socialStats.shares ?? 0,
          impressions: post.socialStats.impressions ?? 0,
          lastUpdated: toOptionalIso(post.socialStats.lastUpdated),
        }
      : undefined,
    createdAt: toIso(post?.createdAt),
    updatedAt: toIso(post?.updatedAt),
  };
}

export function serializeAiActivity(activity: any): AiActivity {
  return {
    id: toId(activity?._id ?? activity?.id),
    leadId: toId(activity?.leadId),
    campaignId: activity?.campaignId ? toId(activity.campaignId) : undefined,
    type: activity?.type ?? "Other",
    content: activity?.content ?? "",
    generatedContent: activity?.generatedContent ?? undefined,
    timestamp: toIso(activity?.timestamp),
  };
}

export function serializeSystemHealth(status: any): SystemHealthResponse {
  return {
    apollo: {
      status: status?.apollo?.status ?? "unknown",
      message: status?.apollo?.message ?? "",
    },
    gemini: {
      status: status?.gemini?.status ?? "unknown",
      message: status?.gemini?.message ?? "",
    },
    smtp: {
      status: status?.smtp?.status ?? "unknown",
      message: status?.smtp?.message ?? "",
    },
    linkedin: {
      status: status?.linkedin?.status ?? "unknown",
      message: status?.linkedin?.message ?? "",
    },
  };
}

export function serializeBlog(blog: any): Blog {
  return {
    id: toId(blog?._id ?? blog?.id),
    title: blog?.title ?? "",
    excerpt: blog?.excerpt ?? "",
    content: blog?.content ?? "",
    slug: blog?.slug ?? "",
    author: {
      name: blog?.author?.name ?? "Prabhat Patra",
      role: blog?.author?.role ?? "Founder @ Rhinon Labs",
      avatar: blog?.author?.avatar ?? undefined,
    },
    coverImage: blog?.coverImage ?? undefined,
    tags: blog?.tags ?? [],
    readTime: blog?.readTime ?? "5 min read",
    publishedAt: toIso(blog?.publishedAt),
    status: blog?.status ?? "Published",
    createdAt: toIso(blog?.createdAt),
    updatedAt: toIso(blog?.updatedAt),
  };
}

export function serializeUser(user: any): User {
  return {
    id: toId(user?._id ?? user?.id),
    name: user?.name ?? "",
    email: user?.email ?? "",
    linkedinUrl: user?.linkedinUrl ?? undefined,
    linkedinConnected: user?.linkedinConnected ?? undefined,
    isPrimaryAdmin: user?.isPrimaryAdmin ?? false,
    roleId: user?.roleId ?? "",
    mustChangePassword: user?.mustChangePassword ?? false,
    avatarUrl: user?.avatarUrl ?? undefined,
    status: user?.status ?? "Active",
    joinedAt: toIso(user?.joinedAt),
  };
}
