import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import rolesRoutes from "./routes/roles";
import permissionsRoutes from "./routes/permissions";
import employeesRoutes from "./routes/employees";
import provisioningRoutes from "./routes/provisioning";
import inboxRoutes from "./routes/inbox";
import payrollRoutes from "./routes/payroll";
import peopleRoutes from "./routes/people";
import tasksRoutes from "./routes/tasks";
import attendanceRoutes from "./routes/attendance";
import dashboardRoutes from "./routes/dashboard";
import workRoutes from "./routes/work";
import webhooksRoutes from "./routes/webhooks";
import publicRoutes from "./routes/public";
import leadsRoutes from "./routes/leads";
import campaignsRoutes from "./routes/campaigns";
import outreachRoutes from "./routes/outreach";
import leaveRoutes from "./routes/leave";
import performanceRoutes from "./routes/performance";
import documentsRoutes from "./routes/documents";
import linkedinRoutes from "./routes/linkedin";
import aiRoutes from "./routes/ai";
import contentRoutes from "./routes/content";
import analyticsRoutes from "./routes/analytics";
import docsAccessRoutes from "./routes/docs-access";
import brandingRoutes from "./routes/branding";

const app = express();

const allowedOrigins = [
  ...env.frontendUrls,
  "http://localhost:4200",
  "http://localhost:3000",
].filter(Boolean);
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(express.json({ limit: "20mb" }));

app.use("/auth", authRoutes);
app.use("/roles", rolesRoutes);
app.use("/permissions", permissionsRoutes);
app.use("/employees", employeesRoutes);
app.use("/provisioning", provisioningRoutes);
app.use("/inbox", inboxRoutes);
app.use("/payroll", payrollRoutes);
app.use("/people", peopleRoutes);
app.use("/tasks", tasksRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/work", workRoutes);
app.use("/leads", leadsRoutes);
app.use("/campaigns", campaignsRoutes);
app.use("/outreach", outreachRoutes);
app.use("/leave", leaveRoutes);
app.use("/performance", performanceRoutes);
app.use("/documents", documentsRoutes);
app.use("/linkedin", linkedinRoutes);
app.use("/ai", aiRoutes);
app.use("/content", contentRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/docs-access", docsAccessRoutes);
app.use("/branding", brandingRoutes);

// Use text parser for SNS webhooks since AWS SNS sends content-type text/plain
app.use("/webhooks", express.text({ type: ["application/json", "text/plain"] }), webhooksRoutes);

// Public unauthenticated routes
app.use("/public", publicRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
