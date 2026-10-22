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
import { runForOrg } from "../services/tenantContext";
import { legal } from "../config/legal";
import { parseBeaconBody, recordPageview, enrichGeoInBackground } from "../services/pageviewIngest";

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
    // Which brand's traffic this is. The beacon may name a site (`domain`), and
    // the Uppercurve front-end does; rhinonlabs.com sends nothing and falls
    // through to the workspace's default site, which is Rhinon Labs.
    const b = parseBeaconBody(req.body);
    const site = await resolvePublicSite(b.site ?? b.domain ?? req.query.domain);

    const view = await recordPageview(req, b, { siteId: site?.id ?? null, companyLookup: true });
    res.status(204).end(); // junk is ignored silently, and so are failures below
    if (view) enrichGeoInBackground(req, view);
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
/** Records an opt-out inside the organization that sent the mail. */
async function recordUnsubscribe(email: string, organizationId: string | null, reason: string) {
  const run = async () => {
    const [entry, created] = await Unsubscribe.findOrCreate({
      where: { email },
      defaults: { email, reason } as never,
    });
    if (!created && !entry.reason) await entry.update({ reason });
  };
  // With an org the row lands in that workspace's list; without one (links sent
  // before workspaces existed) it lands in whatever the public context resolved,
  // which is the platform workspace.
  if (organizationId) await runForOrg(organizationId, run, { label: "unsubscribe" });
  else await run();
}

router.post("/unsubscribe/one-click", async (req: Request, res: Response) => {
  const email = String(req.query.email ?? "").trim().toLowerCase();
  const token = String(req.query.t ?? "");
  const organizationId = req.query.o ? String(req.query.o) : null;

  if (!verifyUnsubscribe(email, token, organizationId)) {
    res.status(403).json({ message: "Invalid unsubscribe link" });
    return;
  }

  try {
    await recordUnsubscribe(email, organizationId, "One-click unsubscribe (RFC 8058)");
  } catch (err: any) {
    console.error("[Unsubscribe] one-click failed:", err.message);
  }

  // Always 200: a provider that sees an error may keep retrying or downgrade
  // the sender's reputation.
  res.status(200).json({ message: "Unsubscribed" });
});

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function unsubscribePage(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Email preferences</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b}main{background:#fff;max-width:420px;margin:16px;padding:32px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1)}h1{font-size:20px;margin:0 0 12px}p{line-height:1.6;color:#52525b;margin:0 0 20px}button{background:#18181b;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:15px;cursor:pointer}</style></head><body><main>${body}</main></body></html>`;
}

/**
 * Human unsubscribe page. GET only shows a confirm button and changes nothing:
 * mail security scanners and link-preview bots fetch every URL in a message, and
 * an unsubscribe that fired on GET would silently opt recipients out.
 */
router.get("/unsubscribe/page", async (req: Request, res: Response) => {
  const email = String(req.query.email ?? "").trim().toLowerCase();
  const token = String(req.query.t ?? "");
  const organizationId = req.query.o ? String(req.query.o) : null;

  if (!verifyUnsubscribe(email, token, organizationId)) {
    res.status(403).type("html").send(unsubscribePage("<h1>Link not valid</h1><p>This unsubscribe link is invalid or has been altered.</p>"));
    return;
  }

  res.type("html").send(
    unsubscribePage(
      `<h1>Unsubscribe</h1><p>Stop sending emails to <strong>${escapeHtml(email)}</strong>?</p>` +
        `<form method="post" action=""><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="t" value="${escapeHtml(token)}">${organizationId ? `<input type="hidden" name="o" value="${escapeHtml(organizationId)}">` : ""}<button type="submit">Confirm unsubscribe</button></form>`
    )
  );
});

router.post("/unsubscribe/page", express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const token = String(req.body?.t ?? "");
  const organizationId = req.body?.o ? String(req.body.o) : null;

  if (!verifyUnsubscribe(email, token, organizationId)) {
    res.status(403).type("html").send(unsubscribePage("<h1>Link not valid</h1><p>This unsubscribe link is invalid or has been altered.</p>"));
    return;
  }

  try {
    await recordUnsubscribe(email, organizationId, "Unsubscribed via email footer link");
    res.type("html").send(unsubscribePage(`<h1>You're unsubscribed</h1><p><strong>${escapeHtml(email)}</strong> will no longer receive these emails.</p>`));
  } catch (err: any) {
    console.error("[Unsubscribe] page failed:", err.message);
    res.status(500).type("html").send(unsubscribePage("<h1>Something went wrong</h1><p>Please try again in a moment.</p>"));
  }
});

/** Where the legal documents live and which version is current, for the signup form. */
router.get("/legal", (_req: Request, res: Response) => {
  res.json({
    termsVersion: legal.termsVersion,
    termsUrl: legal.termsUrl || null,
    privacyUrl: legal.privacyUrl || null,
    dpaUrl: legal.dpaUrl || null,
    acceptanceRequired: legal.requireAcceptance,
  });
});

router.post("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const b = req.body || {};
    const emailRaw = (b.email ?? "").toString().trim();
    const email = emailRaw.toLowerCase();
    const reason = (b.reason ?? "").toString().trim();
    const token = (b.t ?? "").toString();

    // Links now carry a signature over the address. Forms that send one must
    // get it right; forms that do not (the marketing-site page until it is
    // updated to forward ?t=) still work, since the worst an unsigned request
    // can do is add an address to the platform's own suppression list.
    if (token && !verifyUnsubscribe(email, token)) {
      res.status(403).json({ message: "Invalid unsubscribe link" });
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "A valid email address is required" });
      return;
    }

    if (!reason) {
      res.status(400).json({ message: "Please provide a reason for unsubscribing" });
      return;
    }

    // One row per address: repeat submissions (or a bot replaying the form) must
    // not grow the table.
    const [unsubscribeEntry] = await Unsubscribe.findOrCreate({
      where: { email },
      defaults: { email, reason } as never,
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
