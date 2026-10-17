// Single source of truth for company facts. Structured data (JSON-LD), llms.txt
// and llms-full.txt all read from here so search engines and AI models are told
// one consistent story — keep it in sync with what the site visibly says.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinonlabs.com").replace(/\/$/, "");

export const COMPANY = {
  name: "Rhinon Labs",
  url: SITE_URL,
  logo: `${SITE_URL}/Logo_Rhinon_Labs_Light.png`,
  tagline: "Scale your operations, not your headcount.",
  /** One-sentence description used for meta, JSON-LD and the llms.txt summary */
  description:
    "Rhinon Labs is a product and automation studio in Hyderabad, India that designs, builds and launches MVPs, AI agents, workflow automations, internal dashboards, websites and mobile apps for startups and growing businesses — usually within 2–4 weeks.",
  address: {
    locality: "Hyderabad",
    region: "Telangana",
    country: "IN",
    countryName: "India",
  },
  // Same number the site shows in the hero, contact page and floating button
  phone: "+91 8249 291 789",
  phoneE164: "+918249291789",
  whatsapp: "https://wa.me/918249291789",
  // Same profiles the footer links to
  sameAs: [
    "https://www.linkedin.com/company/rhinonlabs",
    "https://x.com/RhinonLabs",
    "https://www.instagram.com/rhinonlabs/",
  ],
  areaServed: "Worldwide",
  languages: ["English"],
  /** Facts stated elsewhere on the site — repeated verbatim for AI answers */
  facts: [
    "Most projects are scoped and delivered within 2–4 weeks, with a fixed scope and timeline agreed before work starts.",
    "Clients don't need to be technical — Rhinon Labs handles design, development, deployment and hosting end-to-end.",
    "Clients own their code, designs and infrastructure.",
    "Systems are built around a client's existing tools rather than replacing them.",
    "Optional monthly or quarterly support retainers are available after launch.",
    "Trusted by 20+ startups and SMBs worldwide.",
  ],
} as const;

/** Stable JSON-LD node ids, so every page's schema links to the same entities */
export const SCHEMA_IDS = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
} as const;
