import express, { Router, Response, Request } from "express";
import { ClientRequest, Project, User, Lead, Blog, CaseStudy, PageView, DocsAccess } from "../models";
import { sendEmail } from "../services/mailer";
import { env } from "../config/env";
import { classifyChannel, parseHost, isBotUserAgent } from "../services/analytics";

const router = Router();

// Fields exposed to the public marketing site (never leak Draft content or internal columns).
const PUBLIC_BLOG_FIELDS = [
  "id", "title", "excerpt", "content", "slug",
  "authorName", "authorRole", "authorAvatar",
  "coverImage", "tags", "readTime", "publishedAt",
] as const;

// Fire-and-forget heads-up to the team when a new website lead lands. Never throws.
async function notifyNewLead(lead: {
  name: string;
  email: string;
  whatsapp: string | null;
  message: string | null;
  company: string | null;
}) {
  if (!env.leadsNotifyEmail) return; // notifications disabled
  try {
    const rows = [
      ["Name", lead.name],
      ["Email", lead.email],
      ["WhatsApp", lead.whatsapp || "—"],
      ["Company", lead.company || "—"],
      ["Message", lead.message || "—"],
    ]
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600">${k}</td><td>${v}</td></tr>`)
      .join("");
    await sendEmail({
      to: env.leadsNotifyEmail,
      subject: `New website lead: ${lead.name}`,
      html: `<p>A new lead came in from the Rhinon Labs website.</p><table>${rows}</table>`,
      text: `New website lead\nName: ${lead.name}\nEmail: ${lead.email}\nWhatsApp: ${lead.whatsapp || "—"}\nCompany: ${lead.company || "—"}\nMessage: ${lead.message || "—"}`,
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

    // Best-effort, after the response — never blocks or fails the request.
    void notifyNewLead({ name, email, whatsapp, message, company });
  } catch (error: any) {
    console.error("Failed to save web lead:", error);
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

// GET /public/blogs — published blogs for the marketing site, newest first
router.get("/blogs", async (_req: Request, res: Response) => {
  try {
    const blogs = await Blog.findAll({
      where: { status: "Published" },
      attributes: PUBLIC_BLOG_FIELDS as unknown as string[],
      order: [["publishedAt", "DESC"]],
    });
    res.json(blogs);
  } catch (err) {
    console.error("Failed to fetch public blogs:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

// GET /public/blogs/:slug — single published blog
router.get("/blogs/:slug", async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findOne({
      where: { slug: req.params.slug, status: "Published" },
      attributes: PUBLIC_BLOG_FIELDS as unknown as string[],
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
      attributes: [...PUBLIC_CASE_STUDY_FIELDS, "content"] as unknown as string[],
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

export default router;
