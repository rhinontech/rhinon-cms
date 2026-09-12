import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { runAsSystem } from "./services/tenantContext";
import { publicTenantContext } from "./services/publicTenant";
import authRoutes from "./routes/auth";
import rolesRoutes from "./routes/roles";
import permissionsRoutes from "./routes/permissions";
import employeesRoutes from "./routes/employees";
import letterTemplatesRoutes from "./routes/letterTemplates";
import provisioningRoutes from "./routes/provisioning";
import inboxRoutes from "./routes/inbox";
import payrollRoutes from "./routes/payroll";
import peopleRoutes from "./routes/people";
import tasksRoutes from "./routes/tasks";
import attendanceRoutes from "./routes/attendance";
import dashboardRoutes from "./routes/dashboard";
import workRoutes from "./routes/work";
import teamsRoutes from "./routes/teams";
import workflowRoutes from "./routes/workflow";
import webhooksRoutes from "./routes/webhooks";
import publicRoutes from "./routes/public";
import leadsRoutes from "./routes/leads";
import crmRoutes from "./routes/crm";
import accountsRoutes from "./routes/accounts";
import dealsRoutes from "./routes/deals";
import activitiesRoutes from "./routes/activities";
import campaignsRoutes from "./routes/campaigns";
import outreachRoutes from "./routes/outreach";
import contactGroupsRoutes from "./routes/contactGroups";
import leaveRoutes from "./routes/leave";
import performanceRoutes from "./routes/performance";
import documentsRoutes from "./routes/documents";
import linkedinRoutes from "./routes/linkedin";
import aiRoutes from "./routes/ai";
import contentRoutes from "./routes/content";
import analyticsRoutes from "./routes/analytics";
import docsAccessRoutes from "./routes/docs-access";
import brandingRoutes from "./routes/branding";
import documentSigningRoutes from "./routes/documentSigning";
import pagesRoutes from "./routes/pages";
import googleCalendarSettingsRoutes from "./routes/googleCalendarSettings";
import meetingsRoutes from "./routes/meetings";
import scheduleCallRoutes from "./routes/scheduleCall";
import startupIdeasRoutes from "./routes/startupIdeas";
import deployRoutes from "./routes/deploy";

const app = express();

const allowedOrigins = [
  ...env.frontendUrls,
  "http://localhost:4200",
  "http://localhost:3000",
].filter(Boolean);
// Private-LAN origins are allowed for dev (testing from phones on the same
// network); production origins still come from env.frontendUrls.
const isLanDevOrigin = (origin: string) => /^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))[\d.]*:4200$/.test(origin);
// /public/* is an open, credential-less API (lead capture, pageview tracking, published
// content) that external platforms post to from any origin; everything else stays
// restricted to the known frontends.
const openCors = cors({ origin: true });
const restrictedCors = cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin) || isLanDevOrigin(origin)),
  credentials: true,
});
app.use((req, res, next) =>
  req.path.startsWith("/public") ? openCors(req, res, next) : restrictedCors(req, res, next)
);
app.use(express.json({ limit: "20mb" }));

// One line per request, after the body parser so payloads are readable and before
// the routes so nothing escapes it. Tune with LOG_REQUESTS / LOG_BODY / LOG_SKIP.
app.use(requestLogger);

import workflowsRoutes from "./routes/workflows";

app.use("/auth", authRoutes);
app.use("/workflows", workflowsRoutes);
app.use("/roles", rolesRoutes);
app.use("/permissions", permissionsRoutes);
app.use("/employees", employeesRoutes);
app.use("/letter-templates", letterTemplatesRoutes);
app.use("/provisioning", provisioningRoutes);
app.use("/inbox", inboxRoutes);
app.use("/payroll", payrollRoutes);
app.use("/people", peopleRoutes);
app.use("/tasks", tasksRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/work", workRoutes);
app.use("/teams", teamsRoutes);
app.use("/workflow", workflowRoutes);
app.use("/leads", leadsRoutes);
app.use("/crm", crmRoutes);
app.use("/accounts", accountsRoutes);
app.use("/deals", dealsRoutes);
app.use("/activities", activitiesRoutes);
app.use("/campaigns", campaignsRoutes);
app.use("/outreach", outreachRoutes);
app.use("/contact-groups", contactGroupsRoutes);
app.use("/leave", leaveRoutes);
app.use("/performance", performanceRoutes);
app.use("/documents", documentsRoutes);
app.use("/linkedin", linkedinRoutes);
app.use("/google-calendar", googleCalendarSettingsRoutes);
app.use("/meetings", meetingsRoutes);
app.use("/ai", aiRoutes);
app.use("/content", contentRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/startup-ideas", startupIdeasRoutes);
app.use("/deploy", deployRoutes);
app.use("/docs-access", docsAccessRoutes);
app.use("/pages", pagesRoutes);
app.use("/branding", brandingRoutes);
app.use("/document-signing", documentSigningRoutes);

// Use text parser for SNS webhooks since AWS SNS sends content-type text/plain

/**
 * Unauthenticated routers resolve their own tenant (an API key, a slug, an
 * inbound recipient address) or genuinely serve all of them, so they cannot
 * enter a tenant context up front. Declaring system mode keeps the tenancy
 * hooks quiet HERE and loud everywhere else — an unscoped query on an
 * authenticated route stays a warning rather than blending in.
 *
 * Scoping these down to a resolved organization is Phase 4.
 */
const systemContext = (label: string): express.RequestHandler =>
  (_req, _res, next) => runAsSystem(label, next);

app.use("/webhooks", systemContext("webhooks"), express.text({ type: ["application/json", "text/plain"] }), webhooksRoutes);

// Public unauthenticated routes
/**
 * The public API is mounted twice against the SAME routers.
 *
 * Bare `/public/...` resolves an x-api-key header, and failing that the
 * platform org — a compatibility requirement, not a convenience: rhinonlabs.com
 * already calls /public/blogs with no key and would go blank without it.
 * `/public/:orgSlug/...` names the workspace in the path instead.
 *
 * Order matters, and the intuitive order is wrong. Mounting the :orgSlug form
 * first makes "/public/blogs" match it with orgSlug="blogs", so every existing
 * unprefixed call 404s. Mounting bare first is what works: "/public/blogs"
 * matches a real route there, while "/public/swiggy/blogs" matches nothing and
 * falls through to the :orgSlug mount below.
 */
app.use("/public", publicTenantContext(), publicRoutes);
app.use("/public", publicTenantContext(), scheduleCallRoutes);
app.use("/public/:orgSlug", publicTenantContext(), publicRoutes);
app.use("/public/:orgSlug", publicTenantContext(), scheduleCallRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
