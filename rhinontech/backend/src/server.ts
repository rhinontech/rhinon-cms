import app from "./app";
import { env } from "./config/env";
import { sequelize } from "./config/database";
import { syncDatabase } from "./models";
import { Campaign } from "./models/Campaign";
import { Attendance } from "./models/Attendance";
import { Op } from "sequelize";
import cron from "node-cron";
import axios from "axios";

async function autoClockOut() {
  const today = new Date().toISOString().split("T")[0];
  // Set clock-out to 22:00 local time expressed as UTC
  const clockOutTime = new Date(`${today}T22:00:00`);

  const [count] = await Attendance.update(
    { clockOut: clockOutTime, note: "Auto clocked out at 10:00 PM" },
    {
      where: {
        date: today,
        clockIn: { [Op.ne]: null } as any,
        clockOut: null as any,
      },
    }
  );

  if (count > 0) {
    console.log(`[Cron] Auto clocked out ${count} employee(s) at 10:00 PM.`);
  }
}

async function start() {
  await sequelize.authenticate();
  console.log("Database connected");

  await syncDatabase();
  console.log("Models synced");

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);

    // Auto clock-out: runs every day at 10:00 PM
    cron.schedule("0 22 * * *", async () => {
      console.log("[Cron] Running auto clock-out...");
      try {
        await autoClockOut();
      } catch (err: any) {
        console.error("[Cron] Auto clock-out failed:", err.message);
      }
    });

    // Outreach campaign engine: check every minute, fire for campaigns whose runTime matches now
    cron.schedule("* * * * *", async () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, "0");
      const mm = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hh}:${mm}`;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = dayNames[now.getDay()];

      try {
        const activeCampaigns = await Campaign.findAll({
          where: { stage: "Active" },
          attributes: ["id", "runTime", "scheduleDays"],
        });

        for (const c of activeCampaigns) {
          const runTime = c.runTime || "09:00";
          const scheduleDays: string[] = c.scheduleDays || ["Mon","Tue","Wed","Thu","Fri"];
          if (runTime === currentTime && scheduleDays.includes(currentDay)) {
            console.log(`[Cron] Firing outreach engine for campaign ${c.id} at ${currentTime}`);
            await axios.get(`http://localhost:${env.port}/campaigns/cron/run`, {
              headers: { Authorization: `Bearer ${env.cronSecret}` },
            });
            break; // engine processes all active campaigns in one pass
          }
        }
      } catch (err: any) {
        console.error("[Cron] Outreach schedule check failed:", err.message);
      }
    });
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
