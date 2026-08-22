import express, { Router, Response, Request } from "express";
import { ClientRequest, Project, User, Lead, Blog, CaseStudy, Event, PageView, DocsAccess, WorkflowEnrollment, CampaignActivity, Visitor } from "../models";
import type { BlogDomain } from "../models/Blog";
import { sendEmail } from "../services/mailer";
import { env } from "../config/env";
import { classifyChannel, parseHost, isBotUserAgent } from "../services/analytics";
import { enrollRealtimeLead } from "../services/workflowEngine";
import { extractClientIp, lookupIpLocation } from "../services/geolocation";

const router = Router();

const BLOG_DOMAINS: BlogDomain[] = ["rhinonlabs", "uppercurve"];
function parseDomain(value: unknown): BlogDomain {
  return BLOG_DOMAINS.includes(value as BlogDomain) ? (value as BlogDomain) : "rhinonlabs";
}

// Fields exposed to the public marketing site (never leak Draft content or internal columns).
// The list stays light (no blocks/faqs); the detail adds the full body + SEO fields.
const PUBLIC_BLOG_LIST_FIELDS = [
  "id", "title", "excerpt", "slug",
  "authorName", "authorRole", "authorAvatar",
  "coverImage", "tags", "category", "readTime", "publishedAt",
] as const;

const PUBLIC_BLOG_DETAIL_FIELDS = [
  ...PUBLIC_BLOG_LIST_FIELDS,
  "content", "contentBlocks", "faqs", "metaTitle", "metaDescription",
] as const;

// Events mirror the blog field shape (no `domain` column — the Events table is uppercurve-only).
const PUBLIC_EVENT_LIST_FIELDS = [
  "id", "title", "excerpt", "slug",
  "authorName", "authorRole", "authorAvatar",
  "coverImage", "tags", "category", "readTime", "publishedAt",
] as const;

const PUBLIC_EVENT_DETAIL_FIELDS = [
  ...PUBLIC_EVENT_LIST_FIELDS,
  "content", "contentBlocks", "faqs", "metaTitle", "metaDescription",
] as const;

// Fire-and-forget heads-up to the team when a new lead lands. Never throws.
async function notifyNewLead(
  lead: {
    name: string;
    email: string;
    whatsapp: string | null;
    message: string | null;
    company: string | null;
  },
  opts?: { originLabel?: string; extra?: Array<[string, string | null]> }
) {
  if (!env.leadsNotifyEmail) return; // notifications disabled
  const originLabel = opts?.originLabel || "website";
  try {
    const allRows: Array<[string, string | null]> = [
      ["Name", lead.name],
      ["Email", lead.email],
      ["WhatsApp / Phone", lead.whatsapp],
      ["Company", lead.company],
      ["Message", lead.message],
      ...(opts?.extra || []),
    ];
    const rows = allRows
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600">${k}</td><td>${v || "—"}</td></tr>`)
      .join("");
    await sendEmail({
      to: env.leadsNotifyEmail,
      subject: `New ${originLabel} lead: ${lead.name}`,
      html: `<p>A new lead came in from the Rhinon Labs ${originLabel}.</p><table>${rows}</table>`,
      text: `New ${originLabel} lead\n${allRows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n")}`,
    });
  } catch (err) {
    console.error("Failed to send new-lead notification:", err);
  }
}

const requestIncludes = [
  { model: Project, as: "project", attributes: ["id", "name", "status"] },
  { model: User, as: "creator", attributes: ["id", "fullName"] },
];

router.get("/projects/:projectId/requests", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId, {
      attributes: ["id", "name", "status"],
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const requests = await ClientRequest.findAll({
      where: { projectId },
      include: requestIncludes,
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "title",
        "description",
        "type",
        "status",
        "priority",
        "reportedBy",
        "createdAt",
        "updatedAt",
      ],
    });

    res.json({
      project,
      requests,
    });
  } catch (err) {
    console.error("Failed to fetch public project requests:", err);
    res.status(500).json({ message: "Failed to fetch project data" });
  }
});

// POST /public/web-leads — unauthenticated lead capture from the marketing site.
// Saves into the same Lead table the admin-panel Outreach module reads from.
router.post("/web-leads", async (req: Request, res: Response) => {
  try {
    const b = req.body || {};
    const str = (v: any, max = 5000): string | null => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s.slice(0, max);
    };

    const name = str(b.name, 200);
    const emailRaw = str(b.email, 320);
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    const whatsapp = str(b.whatsapp ?? b.phone, 40);
    const message = str(b.message, 5000);
    const company = str(b.company, 200);
    const projectType = str(b.projectType, 200);

    if (!name || !email) {
      res.status(400).json({ message: "Name and email are required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Please provide a valid email address" });
      return;
    }

    const raw = { whatsapp, message, company, projectType, submittedAt: new Date().toISOString() };

    // Avoid duplicate leads: if this email already exists, append the new enquiry to its notes
    // instead of failing on the unique constraint.
    const existing = await Lead.findOne({ where: { email } });
    if (existing) {
      const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const appended = [existing.notes, `[${stamp}] Website enquiry: ${message || "(no message)"}`]
        .filter(Boolean)
        .join("\n");
      await existing.update({
        notes: appended,
        phone: existing.phone || whatsapp || undefined,
      });
      res.status(200).json({ ok: true, deduped: true });
    } else {
      await Lead.create({
        name,
        email,
        company: company || "Website Enquiry",
        phone: whatsapp,
        notes: message,
        source: "Website",
        status: "New",
        raw,
      } as any);
      res.status(201).json({ ok: true });
    }

    // Trigger real-time workflow enrollment for Contact Us Form
    const createdOrUpdatedLead = existing || (await Lead.findOne({ where: { email } }));
    if (createdOrUpdatedLead) {
      void enrollRealtimeLead(createdOrUpdatedLead, "Contact Us Form");
    }

    // Best-effort, after the response — never blocks or fails the request.
    void notifyNewLead({ name, email, whatsapp, message, company });
  } catch (error: any) {
    console.error("Failed to save web lead:", error);
    res.status(500).json({ message: "Failed to save lead" });
  }
});

// POST /public/platform-leads — unauthenticated lead capture from external Rhinon platforms
// (e.g. the scheduler product). Saves into the same Lead table the Outreach module reads;
// platform-specific fields (institution type, team size, lead volume) land in `raw` and show
// up in the admin lead detail's Raw Data section.
router.post("/platform-leads", async (req: Request, res: Response) => {
  try {
    const b = req.body || {};
    const str = (v: any, max = 500): string | null => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s.slice(0, max);
    };

    const name = str(b.name, 200);
    const emailRaw = str(b.email, 320);
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    if (!name || !email) {
      res.status(400).json({ message: "Name and email are required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Please provide a valid email address" });
      return;
    }

    const phone = str(b.phone, 40);
    const website = str(b.website, 300);
    const institutionType = str(b.institutionType, 200);
    const annualLeadVolume = str(b.annualLeadVolume, 100);
    const teamSize = str(b.teamSize, 100);
    const message = str(b.message, 5000);
    const source = str(b.source, 100) || "Platform";

    // Company fallback: explicit value → website domain → generic label.
    let company = str(b.company, 200);
    if (!company && website) {
      try {
        company = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
      } catch { /* unparseable website — keep fallback */ }
    }
    company = company || "Platform Lead";

    const summary = [
      institutionType && `Institution: ${institutionType}`,
      teamSize && `Team size: ${teamSize}`,
      annualLeadVolume && `Annual lead volume: ${annualLeadVolume}`,
      message && `Message: ${message}`,
    ].filter(Boolean).join(" · ");

    const raw = { institutionType, annualLeadVolume, teamSize, message, submittedAt: new Date().toISOString() };

    // Same dedupe behaviour as web-leads: repeat enquiries append to notes instead of failing
    // on the unique email constraint.
    const existing = await Lead.findOne({ where: { email } });
    if (existing) {
      const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const appended = [existing.notes, `[${stamp}] ${source} enquiry: ${summary || "(no details)"}`]
        .filter(Boolean)
        .join("\n");
      // Only merge fields the new submission actually provided — never null out earlier data.
      const rawProvided = Object.fromEntries(Object.entries(raw).filter(([, v]) => v != null));
      await existing.update({
        notes: appended,
        phone: existing.phone || phone || undefined,
        website: existing.website || website || undefined,
        raw: { ...(existing.raw || {}), ...rawProvided },
      });
      res.status(200).json({ ok: true, deduped: true });
    } else {
      await Lead.create({
        name,
        email,
        company,
        phone,
        website,
        industry: institutionType,
        notes: summary || null,
        source,
        status: "New",
        raw,
      } as any);
      res.status(201).json({ ok: true });
    }

    // Trigger real-time workflow enrollment for Schedule a Call Form
    const createdOrUpdatedLead = existing || (await Lead.findOne({ where: { email } }));
    if (createdOrUpdatedLead) {
      void enrollRealtimeLead(createdOrUpdatedLead, "Schedule a Call Form");
    }

    // Best-effort, after the response — never blocks or fails the request.
    void notifyNewLead(
      { name, email, whatsapp: phone, message, company },
      {
        originLabel: source.toLowerCase() === "platform" ? "platform" : `${source} platform`,
        extra: [
          ["Website", website],
          ["Institution Type", institutionType],
          ["Team Size", teamSize],
          ["Annual Lead Volume", annualLeadVolume],
        ],
      }
    );
  } catch (error: any) {
    console.error("Failed to save platform lead:", error);
    res.status(500).json({ message: "Failed to save lead" });
  }
});

// POST /public/track — unauthenticated pageview ingest from the marketing site.
// Accepts JSON (fetch) or text/plain (navigator.sendBeacon) bodies. Fire-and-forget:
// always returns fast and never lets a tracking failure surface to the visitor.
router.post("/track", express.text({ type: ["text/plain"] }), async (req: Request, res: Response) => {
  try {
    // express.json handled application/json; express.text handled text/plain (a JSON string).
    let b: any = req.body;
    if (typeof b === "string") {
      try { b = JSON.parse(b); } catch { b = {}; }
    }
    b = b || {};

    const str = (v: any, max = 512): string | null => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s.slice(0, max);
    };

    // Path is required; strip any querystring/hash so grouping by page is clean.
    let path = str(b.path, 512);
    if (path) path = path.split("?")[0].split("#")[0];
    if (!path || !path.startsWith("/")) {
      res.status(204).end(); // ignore junk silently
      return;
    }

    const visitorId = str(b.visitorId, 64);
    const sessionId = str(b.sessionId, 64);
    if (!visitorId || !sessionId) {
      res.status(204).end();
      return;
    }

    const referrer = str(b.referrer, 1024);
    const referrerHost = parseHost(referrer);
    const userAgent = str(req.headers["user-agent"], 1024);
    // Treat both the configured site host and the host that sent this beacon as "us",
    // so internal navigation reads as Direct (not Referral) on localhost and in prod.
    const originHost = parseHost((req.headers.origin as string) || null);
    const selfHosts = [parseHost(env.siteUrl), originHost];

    const utmSource = str(b.utmSource, 256);
    const utmMedium = str(b.utmMedium, 256);
    const utmCampaign = str(b.utmCampaign, 256);
    const utmTerm = str(b.utmTerm, 256);
    const utmContent = str(b.utmContent, 256);

    const channel = classifyChannel({ referrerHost, utmMedium, selfHosts });
    const isBot = isBotUserAgent(userAgent);

    await PageView.create({
      visitorId,
      sessionId,
      path,
      title: str(b.title, 512),
      referrer,
      referrerHost,
      channel,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      userAgent,
      isBot,
    });

    res.status(204).end();
  } catch (err) {
    console.error("Failed to record pageview:", err);
    res.status(204).end(); // never surface tracking errors to the visitor
  }
});

// POST /public/visitors — captures visitor email from URL params, detects IP and resolves location
router.post("/visitors", express.text({ type: ["text/plain"] }), async (req: Request, res: Response) => {
  try {
    let b: any = req.body;
    if (typeof b === "string") {
      try {
        b = JSON.parse(b);
      } catch {
        b = {};
      }
    }
    b = b || {};

    const rawEmail = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      res.status(400).json({ message: "Valid email is required" });
      return;
    }

    const ip = extractClientIp(req);
    const geo = await lookupIpLocation(ip);

    const path = typeof b.path === "string" ? b.path.slice(0, 512) : null;
    const referrer = typeof b.referrer === "string" ? b.referrer.slice(0, 1024) : null;
    const userAgent = (req.headers["user-agent"] as string) || null;

    const visitor = await Visitor.create({
      email: rawEmail,
      ip,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      location: geo.location,
      latitude: geo.latitude,
      longitude: geo.longitude,
      path,
      referrer,
      userAgent: userAgent ? userAgent.slice(0, 1024) : null,
      visitedAt: new Date(),
    });

    res.status(201).json({ success: true, visitor });
  } catch (err) {
    console.error("Failed to record visitor:", err);
    res.status(204).end();
  }
});

// GET /public/blogs?domain=rhinonlabs|uppercurve — published blogs for the marketing site,
// newest first. `domain` defaults to rhinonlabs so the existing Rhinon Labs site (which doesn't
// send it) keeps working unchanged.
router.get("/blogs", async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.findAll({
      where: { status: "Published", domain: parseDomain(req.query.domain) },
      attributes: PUBLIC_BLOG_LIST_FIELDS as unknown as string[],
      order: [["publishedAt", "DESC"]],
    });
    res.json(blogs);
  } catch (err) {
    console.error("Failed to fetch public blogs:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

// GET /public/blogs/:slug?domain=rhinonlabs|uppercurve — single published blog
router.get("/blogs/:slug", async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findOne({
      where: { slug: req.params.slug, status: "Published", domain: parseDomain(req.query.domain) },
      attributes: PUBLIC_BLOG_DETAIL_FIELDS as unknown as string[],
    });
    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }
    res.json(blog);
  } catch (err) {
    console.error("Failed to fetch public blog:", err);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
});

// GET /public/events — published uppercurve events, newest first
router.get("/events", async (_req: Request, res: Response) => {
  try {
    const events = await Event.findAll({
      where: { status: "Published" },
      attributes: PUBLIC_EVENT_LIST_FIELDS as unknown as string[],
      order: [["publishedAt", "DESC"]],
    });
    res.json(events);
  } catch (err) {
    console.error("Failed to fetch public events:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// GET /public/events/:slug — single published event
router.get("/events/:slug", async (req: Request, res: Response) => {
  try {
    const event = await Event.findOne({
      where: { slug: req.params.slug, status: "Published" },
      attributes: PUBLIC_EVENT_DETAIL_FIELDS as unknown as string[],
    });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json(event);
  } catch (err) {
    console.error("Failed to fetch public event:", err);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

const PUBLIC_CASE_STUDY_FIELDS = [
  "id", "title", "description", "slug", "client", "industry",
  "category", "timeline", "liveLink", "date",
  "result", "quote", "image", "images", "stats", "displayOrder",
] as const;

// GET /public/case-studies — published case studies, in display order
router.get("/case-studies", async (_req: Request, res: Response) => {
  try {
    const caseStudies = await CaseStudy.findAll({
      where: { status: "Published" },
      attributes: PUBLIC_CASE_STUDY_FIELDS as unknown as string[],
      order: [["displayOrder", "ASC"], ["createdAt", "DESC"]],
    });
    res.json(caseStudies);
  } catch (err) {
    console.error("Failed to fetch public case studies:", err);
    res.status(500).json({ message: "Failed to fetch case studies" });
  }
});

// GET /public/case-studies/:slug — single published case study (detail page)
router.get("/case-studies/:slug", async (req: Request, res: Response) => {
  try {
    const caseStudy = await CaseStudy.findOne({
      where: { slug: req.params.slug, status: "Published" },
      attributes: [...PUBLIC_CASE_STUDY_FIELDS, "content", "contentBlocks"] as unknown as string[],
    });
    if (!caseStudy) {
      res.status(404).json({ message: "Case study not found" });
      return;
    }
    res.json(caseStudy);
  } catch (err) {
    console.error("Failed to fetch public case study:", err);
    res.status(500).json({ message: "Failed to fetch case study" });
  }
});

// POST /public/docs-access/check — does this email have developer-docs access?
// Called (server-side) by the Rhinon Help docs site at login. Returns only a
// boolean — never any allowlist contents.
router.post("/docs-access/check", async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ allowed: false, message: "Invalid email" });
      return;
    }
    const entry = await DocsAccess.findOne({ where: { email } });
    res.json({ allowed: Boolean(entry) });
  } catch (err) {
    console.error("Failed to check docs access:", err);
    res.status(500).json({ allowed: false });
  }
});
// GET /public/track/open — Email open tracking pixel (1x1 GIF).
// `e` = workflow enrollment id (automation sequences); `l`+`c` = lead+campaign
// id (outreach campaign sends). Both just mark "opened" the first time the
// recipient's client loads this image — see the caveats on that in the docs.
router.get("/track/open", async (req: Request, res: Response) => {
  try {
    const enrollmentId = req.query.e as string;
    const leadId = req.query.l as string;
    const campaignId = req.query.c as string;

    if (enrollmentId) {
      const enrollment = await WorkflowEnrollment.findByPk(enrollmentId);
      if (enrollment) {
        const state = enrollment.trackingState || {};
        const logs = Array.isArray(enrollment.executionLogs) ? [...enrollment.executionLogs] : [];

        if (!state.emailOpened) {
          logs.push({
            timestamp: new Date().toISOString(),
            step: `Email opened by recipient (${enrollment.leadEmail})`,
          });
        }

        enrollment.changed("trackingState", true);
        enrollment.changed("executionLogs", true);
        await enrollment.update({
          trackingState: {
            ...state,
            emailOpened: true,
            openedAt: state.openedAt || new Date().toISOString(),
          },
          executionLogs: logs,
        });
      }
    } else if (leadId && campaignId) {
      const lead = await Lead.findOne({ where: { id: leadId, campaignId } });
      if (lead && !lead.emailOpened) {
        await lead.update({ emailOpened: true, openedAt: new Date() });
        await CampaignActivity.create({
          leadId: lead.id,
          campaignId,
          type: "EmailOpened",
          content: "Recipient opened the email.",
        });
      }
    }
  } catch (err: any) {
    console.error("[Tracking] Email open tracking failed:", err.message);
  }

  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  res.writeHead(200, {
    "Content-Type": "image/gif",
    "Content-Length": pixel.length,
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
  });
  res.end(pixel);
});

// GET /public/track/click — Email link click tracking redirect
router.get("/track/click", async (req: Request, res: Response) => {
  const targetUrl = (req.query.url as string) || "https://rhinontech.com";
  try {
    const enrollmentId = req.query.e as string;
    if (enrollmentId) {
      const enrollment = await WorkflowEnrollment.findByPk(enrollmentId);
      if (enrollment) {
        const state = enrollment.trackingState || {};
        const logs = Array.isArray(enrollment.executionLogs) ? [...enrollment.executionLogs] : [];
        const clickedUrls = Array.isArray(state.clickedUrls) ? [...state.clickedUrls] : [];

        if (!clickedUrls.includes(targetUrl)) {
          clickedUrls.push(targetUrl);
        }

        if (!state.linkClicked) {
          logs.push({
            timestamp: new Date().toISOString(),
            step: `Link inside email clicked by recipient: ${targetUrl}`,
          });
        }

        enrollment.changed("trackingState", true);
        enrollment.changed("executionLogs", true);
        await enrollment.update({
          trackingState: {
            ...state,
            linkClicked: true,
            clickedAt: state.clickedAt || new Date().toISOString(),
            clickedUrls,
          },
          executionLogs: logs,
        });
      }
    }
  } catch (err: any) {
    console.error("[Tracking] Link click tracking failed:", err.message);
  }

  res.redirect(302, targetUrl);
});

export default router;
