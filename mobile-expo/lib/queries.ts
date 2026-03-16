import { apiRequest } from "@/lib/api";
import type {
  AiActivity,
  Campaign,
  Lead,
  MetricsResponse,
  SocialPost,
  SystemHealthResponse,
  Template,
} from "@/lib/types";

export const queryKeys = {
  metrics: ["metrics"] as const,
  health: ["health"] as const,
  leads: ["leads"] as const,
  lead: (id: string) => ["lead", id] as const,
  leadActivities: (id: string) => ["lead-activities", id] as const,
  campaigns: ["campaigns"] as const,
  campaign: (id: string) => ["campaign", id] as const,
  campaignActivities: (id: string) => ["campaign-activities", id] as const,
  templates: ["templates"] as const,
  template: (id: string) => ["template", id] as const,
  posts: ["posts"] as const,
  post: (id: string) => ["post", id] as const,
} as const;

export const rhinonApi = {
  metrics: () => apiRequest<MetricsResponse>("/api/metrics"),
  health: () => apiRequest<SystemHealthResponse>("/api/system/health"),
  leads: () => apiRequest<Lead[]>("/api/leads"),
  lead: (id: string) => apiRequest<Lead>(`/api/leads/${id}`),
  leadActivities: (id: string) => apiRequest<AiActivity[]>(`/api/leads/${id}/activities`),
  campaigns: () => apiRequest<Campaign[]>("/api/campaigns"),
  campaign: (id: string) => apiRequest<Campaign>(`/api/campaigns/${id}`),
  campaignActivities: (id: string) => apiRequest<AiActivity[]>(`/api/campaigns/${id}/activities`),
  templates: () => apiRequest<Template[]>("/api/templates"),
  template: (id: string) => apiRequest<Template>(`/api/templates/${id}`),
  posts: () => apiRequest<SocialPost[]>("/api/posts"),
  post: (id: string) => apiRequest<SocialPost>(`/api/posts/${id}`),
};
