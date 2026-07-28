import app from "./app";
import { env } from "./config/env";
import { sequelize } from "./config/database";
import { syncDatabase } from "./models";
import { Campaign } from "./models/Campaign";
import { Attendance } from "./models/Attendance";
import { finalizeDueOffboardings } from "./services/offboarding";
import { runWorkflowEngineCycle } from "./services/workflowEngine";
import { syncPermissionCatalog } from "./config/permissions";
import { Op } from "sequelize";
import cron from "node-cron";
import axios from "axios";

async function autoClockOut() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Overnight shifts (clocked in yesterday, still open when this runs) keep
  // their original day's attendance record — only clockOut moves to "now".
  const openRecords = await Attendance.findAll({
    where: {
      date: { [Op.in]: [todayStr, yesterdayStr] },
      clockIn: { [Op.ne]: null } as any,
      clockOut: null as any,
    },
  });

  for (const record of openRecords) {
    const breaks = Array.isArray(record.breaks) ? [...record.breaks] : [];
    if (breaks.length && !breaks[breaks.length - 1].end) {
      breaks[breaks.length - 1] = { ...breaks[breaks.length - 1], end: now.toISOString() };
    }
    await record.update({ clockOut: now, breaks, note: "Auto clocked out at 4:00 AM" });
  }

  if (openRecords.length > 0) {
    console.log(`[Cron] Auto clocked out ${openRecords.length} employee(s) at 4:00 AM.`);
  }
}

async function start() {
  await sequelize.authenticate();
  console.log("Database connected");

  await syncDatabase();
  console.log("Models synced");

  // Keep the DB permission catalog in sync with the code catalog (additive)
  try {
    const { total, created } = await syncPermissionCatalog();
    console.log(`[Permissions] Catalog synced (${total} permissions, ${created} new)`);
  } catch (err: any) {
    console.error("[Permissions] Catalog sync failed:", err.message);
  }

  // Catch up on exits whose last working day passed while the server was down
  try {
    await finalizeDueOffboardings();
  } catch (err: any) {
    console.error("[Offboarding] Boot-time finalize failed:", err.message);
  }

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);

    // Auto clock-out: runs every day at 4:00 AM IST, closing out anyone still
    // clocked in (covers late/overnight shifts) without disturbing which day's
    // attendance record they land on.
    cron.schedule("0 4 * * *", async () => {
      console.log("[Cron] Running auto clock-out...");
      try {
        await autoClockOut();
      } catch (err: any) {
        console.error("[Cron] Auto clock-out failed:", err.message);
      }
    }, { timezone: "Asia/Kolkata" });

    // Scheduled offboardings: shortly after midnight IST, deactivate anyone whose
    // last working day has ended
    cron.schedule("5 0 * * *", async () => {
      try {
        await finalizeDueOffboardings();
      } catch (err: any) {
        console.error("[Cron] Offboarding finalize failed:", err.message);
      }
    }, { timezone: "Asia/Kolkata" });

    // Outreach campaign engine: check every minute, one-shot fire for campaigns
    // whose runTime + startDate (exact calendar date, not a recurring weekday)
    // match right now. Each matching campaign is triggered independently so one
    // campaign's schedule can never cause another Active campaign to be sent.
    cron.schedule("* * * * *", async () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, "0");
      const mm = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hh}:${mm}`;
      const todayStr = now.toISOString().slice(0, 10);

      try {
        const dueCampaigns = await Campaign.findAll({
          where: { stage: "Active", autoSend: true },
          attributes: ["id", "startDate", "runTime"],
        });

        const matches = dueCampaigns.filter((c) => {
          const runTime = c.runTime || "09:00";
          const campaignDateStr = new Date(c.startDate).toISOString().slice(0, 10);
          return runTime === currentTime && campaignDateStr === todayStr;
        });

        await Promise.allSettled(
          matches.map(async (c) => {
            console.log(`[Cron] Firing outreach engine for campaign ${c.id} at ${currentTime}`);
            await axios.get(`http://localhost:${env.port}/campaigns/cron/run`, {
              params: { campaignId: c.id },
              headers: { Authorization: `Bearer ${env.cronSecret}` },
            });
          })
        );
      } catch (err: any) {
        console.error("[Cron] Outreach schedule check failed:", err.message);
      }

      // Workflow execution engine: check pending wait steps and batch emails every minute
      try {
        await runWorkflowEngineCycle();
      } catch (err: any) {
        console.error("[Cron] Workflow engine cycle failed:", err.message);
      }
    });
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
