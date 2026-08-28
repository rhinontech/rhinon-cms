import express from "express";
import cors from "cors";
import { env } from "./config/env";
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
app.use("/docs-access", docsAccessRoutes);
app.use("/pages", pagesRoutes);
app.use("/branding", brandingRoutes);
app.use("/document-signing", documentSigningRoutes);

// Use text parser for SNS webhooks since AWS SNS sends content-type text/plain
app.use("/webhooks", express.text({ type: ["application/json", "text/plain"] }), webhooksRoutes);

// Public unauthenticated routes
app.use("/public", publicRoutes);
app.use("/public", scheduleCallRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
