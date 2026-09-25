import { Op } from "sequelize";
import { EventEmailTemplate } from "../models";
import { runAsSystem, runForOrg } from "./tenantContext";
import { deliverTemplate } from "./eventEmail";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2 * 60 * 1000;
/** A send still marked "sending" this long after its last update died mid-run. */
const STALE_SENDING_MS = 15 * 60 * 1000;

/**
 * Sends scheduled event emails that have come due. Runs every minute from the
 * server's cron, replacing Product Space's Agenda (MongoDB) job queue with the
 * database row itself as the schedule.
 *
 * Each template is claimed with a conditional UPDATE (scheduled → sending), so
 * two server processes can never both send the same email. Delivery resumes
 * from `deliveredTo`, so a retry reaches only the guests who were missed.
 */
export async function dispatchDueEventEmails(now = new Date()) {
  // Anything left "sending" by a crashed process goes back in the queue.
  await runAsSystem("cron:event-email-recover", () =>
    EventEmailTemplate.update(
      { status: "scheduled" },
      { where: { status: "sending", updatedAt: { [Op.lt]: new Date(now.getTime() - STALE_SENDING_MS) } } }
    )
  );

  const due = await runAsSystem("cron:event-email-scan", () =>
    EventEmailTemplate.findAll({
      where: { status: "scheduled", isActive: true, scheduledAt: { [Op.lte]: now } },
      order: [["scheduledAt", "ASC"]],
      limit: 20,
    })
  );

  let processed = 0;
  for (const candidate of due) {
    const [claimed] = await runAsSystem("cron:event-email-claim", () =>
      EventEmailTemplate.update(
        { status: "sending", attempts: candidate.attempts + 1 },
        { where: { id: candidate.id, status: "scheduled" } }
      )
    );
    if (!claimed) continue; // another process took it

    const orgId = candidate.organizationId;
    const run = async () => {
      const template = await EventEmailTemplate.findByPk(candidate.id);
      if (!template) return;
      try {
        const result = await deliverTemplate(template);
        const reachedAnyone = result.sent + result.alreadyDelivered > 0;
        if (result.failed.length && template.attempts < MAX_ATTEMPTS) {
          await template.update({
            status: "scheduled",
            scheduledAt: new Date(Date.now() + RETRY_DELAY_MS),
            lastError: `${result.failed.length} recipient(s) failed; retrying.`,
          });
        } else {
          await template.update({
            status: result.total > 0 && !reachedAnyone ? "failed" : "sent",
            sentAt: new Date(),
            lastError: result.failed.length ? `${result.failed.length} recipient(s) could not be reached.` : null,
          });
        }
      } catch (err) {
        const message = (err as Error).message;
        console.error(`[EventEmail] "${template.templateName}" failed:`, message);
        await template.update(
          template.attempts < MAX_ATTEMPTS
            ? { status: "scheduled", scheduledAt: new Date(Date.now() + RETRY_DELAY_MS), lastError: message }
            : { status: "failed", lastError: message }
        );
      }
      processed += 1;
    };
    await (orgId ? runForOrg(orgId, run, { label: "cron:event-email-send" }) : runAsSystem("cron:event-email-send", run));
  }
  return { due: due.length, processed };
}
