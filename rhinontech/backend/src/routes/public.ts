import express, { Router, Response, Request } from "express";
import { Op } from "sequelize";
import { ClientRequest, Project, User, Lead, Blog, CaseStudy, Event, EventGuest, PageView, DocsAccess, WorkflowEnrollment, CampaignActivity, Visitor, Unsubscribe, StartupIdea } from "../models";
import { registerEventHandler } from "./events";
import { verifyGuestToken } from "../services/eventEmail";
import { certificateDownloadUrl } from "../services/eventCertificate";
import { verifyUnsubscribe } from "../services/unsubscribeToken";
import { resolvePublicSite } from "../services/publicTenant";
import type { BlogDomain } from "../models/Blog";
import { clientIpFrom, isIpCompanyLookupEnabled, lookupCompanyByIp } from "../services/ipCompany";
import { sendEmail } from "../services/mailer";
import { env } from "../config/env";
import { classifyChannel, parseHost, isBotUserAgent } from "../services/analytics";
import { enrollRealtimeLead } from "../services/workflowEngine";
import { extractClientIp, lookupIpLocation, lookupIpLocationCached } from "../services/geolocation";

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
// Exported so routes/scheduleCall.ts can reuse it rather than keeping a second copy.
export async function notifyNewLead(
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
      attributes: ["id", "name", "status", "visibility"],
    });

    // The client portal is unauthenticated — anyone holding the id can read it.
    // Team-scoped and private projects are internal by definition and must never
    // be served here, or the whole visibility model is bypassed by a URL.
    if (!project || project.visibility !== "workspace") {
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

    const { visibility, ...publicProject } = project.toJSON() as any;
    res.json({
      project: publicProject,
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
      // Which brand's form this was. Uppercurve posts `?domain=uppercurve`;
      // rhinonlabs.com posts nothing and lands on the default site — so a
      // website lead shows up in the CRM of the site that actually captured it.
      const site = await resolvePublicSite(b.site ?? b.domain ?? req.query.domain);
      await Lead.create({
        name,
        email,
        siteId: site?.id ?? null,
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

    // Resolve the visiting organisation from the request IP, then let the IP go.
    // Bots are skipped — they'd burn lookup quota for no signal.
    let companyName: string | null = null;
    let companyDomain: string | null = null;
    if (!isBot && isIpCompanyLookupEnabled()) {
      const ip = clientIpFrom(req.headers as any, req.socket?.remoteAddress);
      const hit = await lookupCompanyByIp(ip);
      if (hit) {
        companyName = hit.name;
        companyDomain = hit.domain;
      }
    }

    // Which brand's traffic this is. The beacon may name a site (`domain`), and
    // the Uppercurve front-end does; rhinonlabs.com sends nothing and falls
    // through to the workspace's default site, which is Rhinon Labs.
    const site = await resolvePublicSite(b.site ?? b.domain ?? req.query.domain);

    const view = await PageView.create({
      siteId: site?.id ?? null,
      visitorId,
      sessionId,
      path,
      companyName,
      companyDomain,
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

    // Geo is resolved AFTER responding: the beacon must never wait on a third-party
    // lookup. Bots are skipped — they only burn the rate limit. The lookup is cached
    // per IP, so a visitor reading several pages costs one call.
    if (!isBot) {
      void (async () => {
        try {
          const ip = extractClientIp(req);
          const geo = await lookupIpLocationCached(ip);
          if (!geo || (geo.latitude == null && geo.country == null)) return;
          await view.update({
            country: geo.country ?? null,
            region: geo.region ?? null,
            city: geo.city ?? null,
            latitude: geo.latitude ?? null,
            longitude: geo.longitude ?? null,
          });
        } catch (err) {
          console.error("Pageview geo enrichment failed:", err);
        }
      })();
    }
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

    const site = await resolvePublicSite(b.site ?? b.domain ?? req.query.domain);

    const visitor = await Visitor.create({
      siteId: site?.id ?? null,
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
    // Site, not domain: ?domain= is kept as the legacy spelling the Uppercurve
    // site still sends, and resolves to that workspace's matching site.
    const site = await resolvePublicSite(req.query.domain);
    const blogs = await Blog.findAll({
      where: { status: "Published", ...(site ? { siteId: site.id } : {}) },
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
    const site = await resolvePublicSite(req.query.domain);
    const blog = await Blog.findOne({
      where: {
        slug: req.params.slug,
        status: "Published",
        ...(site ? { siteId: site.id } : {}),
      },
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

// GET /public/events — published events for UpperCurve
router.get("/events", async (_req: Request, res: Response) => {
  try {
    const events = await Event.findAll({
      where: {
        [Op.or]: [{ isPublished: true }, { status: "Published" }],
      },
      order: [["eventStartDate", "ASC"], ["createdAt", "DESC"]],
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
    const slug = req.params.slug;
    const event = await Event.findOne({
      where: {
        [Op.or]: [{ eventSlug: slug }, { slug: slug }],
        [Op.and]: [{ [Op.or]: [{ isPublished: true }, { status: "Published" }] }],
      },
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

// POST /public/events/register — register guest for an event from public UpperCurve site
router.post("/events/register", registerEventHandler as any);

/* ---------------------------------------------------------------------------
 * Guest self-service. Guests have no accounts: their personal pages are
 * reached with the signed token from their registration / emails
 * (services/eventEmail.ts guestToken), which names exactly one guest.
 * ------------------------------------------------------------------------- */

const publishedWhere = { [Op.or]: [{ isPublished: true }, { status: "Published" }] };

async function guestFromToken(slug: string, token: unknown) {
  const guestId = verifyGuestToken(token);
  if (!guestId) return { error: "This link is invalid or has been altered." as const };
  const guest = await EventGuest.findByPk(guestId);
  const event = guest ? await Event.findByPk(guest.eventId) : null;
  if (!guest || !event || (event.get("eventSlug") !== slug && event.get("slug") !== slug)) {
    return { error: "This link doesn't match an event registration." as const };
  }
  return { guest, event };
}

// POST /public/events/check-guest-status — { slug, email } → already registered?
router.post("/events/check-guest-status", async (req: Request, res: Response) => {
  try {
    const slug = String(req.body?.slug || req.body?.eventSlug || "");
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!slug || !email) {
      res.status(400).json({ error: "slug and email are required" });
      return;
    }
    const event = await Event.findOne({ where: { eventSlug: slug, ...publishedWhere } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const guest = await EventGuest.findOne({ where: { eventId: event.id, email }, attributes: ["guestType"] });
    res.json(guest ? { result: "SUBMITTED", guestType: guest.guestType } : { result: "NOT_FOUND" });
  } catch (err) {
    console.error("check-guest-status failed:", err);
    res.status(500).json({ error: "Could not check registration" });
  }
});

// GET /public/events/:slug/whatsapp — the event's community link, if it has one
router.get("/events/:slug/whatsapp", async (req: Request, res: Response) => {
  const event = await Event.findOne({ where: { eventSlug: req.params.slug, ...publishedWhere }, attributes: ["eventDetails"] });
  const link = (event?.get("eventDetails") as Record<string, any> | null)?.whatsappLink?.Link;
  if (!link) {
    res.status(404).json({ result: "FAILED", message: "WhatsApp link not found for this event" });
    return;
  }
  res.json({ result: "SUCCESS", whatsappLink: link });
});

// GET /public/events/:slug/guest?token= — a guest's own registration page
router.get("/events/:slug/guest", async (req: Request, res: Response) => {
  try {
    const found = await guestFromToken(req.params.slug, req.query.token);
    if ("error" in found) {
      res.status(403).json({ message: found.error });
      return;
    }
    const { guest, event } = found;
    const details = (event.get("eventDetails") || {}) as Record<string, any>;
    res.json({
      guest: {
        name: guest.name,
        email: guest.email,
        guestType: guest.guestType,
        userType: guest.userType,
        ownReferralCode: guest.ownReferralCode,
        feedbackSubmitted: Boolean(guest.feedbackSubmittedAt),
        certificateApproved: Boolean(guest.certificateApproved),
        certificateId: guest.certificateGenerated ? guest.certificateId : null,
        registeredAt: guest.createdAt,
      },
      event: {
        title: event.get("eventTitle"),
        slug: event.get("eventSlug"),
        type: event.get("eventType"),
        category: event.get("eventCategory"),
        startDate: event.get("eventStartDate"),
        endDate: event.get("eventEndDate"),
        startTime: event.get("eventStartTime"),
        endTime: event.get("eventEndTime"),
        location: event.get("location"),
        locationType: event.get("locationType"),
        bannerUrl: event.get("eventCreativeUrl"),
        acceptingFeedback: Boolean(event.get("canAcceptResponse")),
        // Only confirmed guests get the group link on their page.
        whatsappLink: guest.guestType === "Approved" ? details?.whatsappLink?.Link || null : null,
      },
    });
  } catch (err) {
    console.error("guest page failed:", err);
    res.status(500).json({ message: "Could not load your registration" });
  }
});

// POST /public/events/:slug/feedback — { token, feedbackData }
router.post("/events/:slug/feedback", async (req: Request, res: Response) => {
  try {
    const found = await guestFromToken(req.params.slug, req.body?.token);
    if ("error" in found) {
      res.status(403).json({ error: found.error });
      return;
    }
    const { guest, event } = found;
    const feedbackData = req.body?.feedbackData;
    if (!feedbackData || typeof feedbackData !== "object" || Array.isArray(feedbackData) || !Object.keys(feedbackData).length) {
      res.status(400).json({ error: "feedbackData must be a non-empty object" });
      return;
    }
    if (JSON.stringify(feedbackData).length > 20_000) {
      res.status(413).json({ error: "That response is too long." });
      return;
    }
    if (!event.get("canAcceptResponse")) {
      res.status(409).json({ error: "This event is not accepting feedback at the moment.", code: "CLOSED" });
      return;
    }
    if (guest.guestType !== "Approved") {
      res.status(409).json({ error: "Feedback can only be submitted by approved guests.", code: "NOT_APPROVED" });
      return;
    }
    if (guest.feedbackSubmittedAt) {
      res.status(409).json({ error: "Feedback already submitted for this event.", code: "ALREADY_SUBMITTED" });
      return;
    }
    // Only plain values are kept: this JSON is shown in the admin and exported.
    const clean: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(feedbackData as Record<string, unknown>)) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key)) continue;
      if (typeof value === "string") clean[key] = value.slice(0, 4000);
      else if (typeof value === "number" || typeof value === "boolean") clean[key] = value;
    }
    if (typeof clean.teamMember2Email === "string") clean.teamMember2Email = clean.teamMember2Email.trim().toLowerCase();
    if (["Hackathon", "Teardown"].includes(String(event.get("eventType")))) clean.isPrimaryMember = true;
    await guest.update({ feedbackData: clean, feedbackSubmittedAt: new Date() });
    res.json({ result: "SUCCESS", message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("feedback submit failed:", err);
    res.status(500).json({ error: "Could not save your feedback" });
  }
});

// GET /public/certificates/:certificateId — anyone can verify a certificate
router.get("/certificates/:certificateId", async (req: Request, res: Response) => {
  try {
    const certificateId = String(req.params.certificateId || "").toUpperCase();
    if (!/^[A-Z0-9-]{6,40}$/.test(certificateId)) {
      res.status(404).json({ valid: false });
      return;
    }
    const guest = await EventGuest.findOne({ where: { certificateId, certificateGenerated: true } });
    const event = guest ? await Event.findByPk(guest.eventId) : null;
    if (!guest || !event) {
      res.status(404).json({ valid: false });
      return;
    }
    res.json({
      valid: true,
      certificateId,
      name: guest.name,
      certificateName: guest.certificateName,
      issuedAt: guest.certificateGeneratedAt,
      event: { title: event.get("eventTitle"), slug: event.get("eventSlug"), startDate: event.get("eventStartDate"), endDate: event.get("eventEndDate") },
      imageUrl: await certificateDownloadUrl(certificateId),
    });
  } catch (err) {
    console.error("certificate verify failed:", err);
    res.status(500).json({ valid: false });
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

        // `n` names the email step that produced this pixel, so opens attribute
        // to the right node instead of collapsing into one sequence-wide flag.
        const nodeId = req.query.n as string | undefined;
        const nodes = { ...(state.nodes || {}) };
        if (nodeId) {
          nodes[nodeId] = {
            ...(nodes[nodeId] || {}),
            openedAt: nodes[nodeId]?.openedAt || new Date().toISOString(),
          };
        }

        enrollment.changed("trackingState", true);
        enrollment.changed("executionLogs", true);
        await enrollment.update({
          trackingState: {
            ...state,
            nodes,
            // Kept for enrollments and reports that predate per-node tracking.
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
  const targetUrl = (req.query.url as string) || "https://www.rhinonlabs.com";
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

        const nodeId = req.query.n as string | undefined;
        const nodes = { ...(state.nodes || {}) };
        if (nodeId) {
          const prev = nodes[nodeId] || {};
          const prevUrls = Array.isArray(prev.clickedUrls) ? prev.clickedUrls : [];
          nodes[nodeId] = {
            ...prev,
            clickedAt: prev.clickedAt || new Date().toISOString(),
            clickedUrls: prevUrls.includes(targetUrl) ? prevUrls : [...prevUrls, targetUrl],
          };
        }

        enrollment.changed("trackingState", true);
        enrollment.changed("executionLogs", true);
        await enrollment.update({
          trackingState: {
            ...state,
            nodes,
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

// POST /public/unsubscribe — captures email unsubscribe reason and records it
// POST /public/startup-ideas — unauthenticated capture for the rhinonlabs /build campaign
// page. Intentionally does NOT write to the `leads` table: startup-idea submissions live in
// their own store so a high-volume student campaign never pollutes the CRM pipeline. The
// admin panel converts an idea into a Lead explicitly when it's worth pursuing.
router.post("/startup-ideas", async (req: Request, res: Response) => {
  try {
    const b = req.body || {};
    const str = (v: any, max = 500): string | null => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s.slice(0, max);
    };

    const name = str(b.name, 200);
    const emailRaw = str(b.email, 320);
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    const idea = str(b.idea ?? b.message, 5000);

    if (!name || !email || !idea) {
      res.status(400).json({ message: "Name, email and your idea are required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Please provide a valid email address" });
      return;
    }

    const created = await StartupIdea.create({
      name,
      email,
      phone: str(b.phone ?? b.whatsapp, 40),
      organization: str(b.organization ?? b.company, 200),
      idea,
      stage: str(b.stage, 100),
      budget: str(b.budget, 100),
      source: str(b.source, 100) || "/build",
      utmSource: str(b.utmSource, 200),
      utmMedium: str(b.utmMedium, 200),
      utmCampaign: str(b.utmCampaign, 200),
      referrer: str(b.referrer, 1000),
    });

    res.status(201).json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Failed to save startup idea:", error);
    res.status(500).json({ message: "Failed to submit your idea" });
  }
});

/**
 * RFC 8058 one-click unsubscribe.
 *
 * Hit by the RECEIVING mail provider (Gmail, Yahoo) when the recipient clicks
 * the native Unsubscribe button — not by a browser. So it has no session, takes
 * an empty body, and must answer 200 quickly. The address is HMAC-signed
 * because otherwise anyone could POST arbitrary addresses and suppress a whole
 * list; the separate /unsubscribe form below stays as the human-facing path.
 */
router.post("/unsubscribe/one-click", async (req: Request, res: Response) => {
  const email = String(req.query.email ?? "").trim().toLowerCase();
  const token = String(req.query.t ?? "");

  if (!verifyUnsubscribe(email, token)) {
    res.status(403).json({ message: "Invalid unsubscribe link" });
    return;
  }

  try {
    const [entry, created] = await Unsubscribe.findOrCreate({
      where: { email },
      defaults: { email, reason: "One-click unsubscribe (RFC 8058)" } as never,
    });
    if (!created && !entry.reason) {
      await entry.update({ reason: "One-click unsubscribe (RFC 8058)" });
    }
  } catch (err: any) {
    console.error("[Unsubscribe] one-click failed:", err.message);
  }

  // Always 200: a provider that sees an error may keep retrying or downgrade
  // the sender's reputation.
  res.status(200).json({ message: "Unsubscribed" });
});

router.post("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const b = req.body || {};
    const emailRaw = (b.email ?? "").toString().trim();
    const email = emailRaw.toLowerCase();
    const reason = (b.reason ?? "").toString().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "A valid email address is required" });
      return;
    }

    if (!reason) {
      res.status(400).json({ message: "Please provide a reason for unsubscribing" });
      return;
    }

    const unsubscribeEntry = await Unsubscribe.create({
      email,
      reason,
    });

    // Optionally update lead status if lead exists with this email
    // try {
    //   const existingLead = await Lead.findOne({ where: { email } });
    //   if (existingLead && existingLead.status !== "Unsubscribed") {
    //     await existingLead.update({ status: "Unsubscribed" });
    //   }
    // } catch {
    //   // Ignore lead update failure
    // }

    res.status(201).json({ success: true, message: "Unsubscribed successfully", data: unsubscribeEntry });
  } catch (err: any) {
    console.error("Failed to record unsubscribe:", err);
    res.status(500).json({ message: "Failed to process unsubscribe request" });
  }
});

export default router;
