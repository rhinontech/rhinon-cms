export type ContentDomain = "rhinonlabs" | "uppercurve";
export type ContentResource = "blogs" | "case-studies" | "events";

export interface ContentDomainConfig {
  slug: ContentDomain;
  label: string;
  description: string;
  /** Public site this domain's content is served on — used for "view live" links. */
  siteUrl: string;
  resources: Array<{ key: ContentResource; label: string }>;
}

// Each domain is a separate public site with its own blog; rhinonlabs additionally
// runs case studies, uppercurve additionally runs events.
export const CONTENT_DOMAINS: ContentDomainConfig[] = [
  {
    slug: "rhinonlabs",
    label: "Rhinon Labs",
    description: "Blogs and case studies",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com",
    resources: [
      { key: "blogs", label: "Blogs" },
      { key: "case-studies", label: "Case Studies" },
    ],
  },
  {
    slug: "uppercurve",
    label: "Uppercurve",
    description: "Blogs and events",
    siteUrl: process.env.NEXT_PUBLIC_UPPERCURVE_SITE_URL || "https://uppercurve.com",
    resources: [
      { key: "blogs", label: "Blogs" },
      { key: "events", label: "Events" },
    ],
  },
];

export function isContentDomain(value: string): value is ContentDomain {
  return CONTENT_DOMAINS.some((d) => d.slug === value);
}

export function getDomainConfig(value: string): ContentDomainConfig | undefined {
  return CONTENT_DOMAINS.find((d) => d.slug === value);
}
