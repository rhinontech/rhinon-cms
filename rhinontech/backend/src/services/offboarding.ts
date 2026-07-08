import { Op } from "sequelize";
import { User, LeaveRequest, Attendance, Task, DocsAccess } from "../models";

// Business dates (joining/exit days) are IST regardless of server timezone.
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export interface OffboardCleanupResult {
  leaveRequestsRejected: number;
  attendanceClosed: number;
  tasksUnassigned: number;
  docsAccessRevoked: number;
}

/**
 * Deactivate a user and clean up everything tied to them:
 * - status → inactive, onboarding/reset tokens cleared (kills pending magic links)
 * - pending leave requests auto-rejected
 * - open attendance entries clocked out
 * - open tasks unassigned (back to the pool)
 * - docs access revoked for their company + personal emails
 *
 * Live JWT sessions die via the status check in the authenticate middleware.
 */
export async function finalizeOffboarding(user: User): Promise<OffboardCleanupResult> {
  await user.update({
    status: "inactive",
    onboardingToken: null,
    onboardingTokenExpiry: null,
    resetToken: null,
    resetTokenExpiry: null,
  });

  const [leaveRequestsRejected] = await LeaveRequest.update(
    { status: "Rejected", managerNote: "Auto-rejected: employee offboarded" },
    { where: { userId: user.id, status: "Pending" } }
  );

  const [attendanceClosed] = await Attendance.update(
    { clockOut: new Date(), note: "Auto clocked out on offboarding" },
    {
      where: {
        userId: user.id,
        clockIn: { [Op.ne]: null } as any,
        clockOut: null as any,
      },
    }
  );

  const [tasksUnassigned] = await Task.update(
    { assigneeId: null as any },
    { where: { assigneeId: user.id, status: { [Op.ne]: "Done" } } }
  );

  const emails = [user.companyEmail, user.personalEmail]
    .filter(Boolean)
    .map((e) => e.toLowerCase());
  const docsAccessRevoked = emails.length
    ? await DocsAccess.destroy({ where: { email: { [Op.in]: emails } } })
    : 0;

  return { leaveRequestsRejected, attendanceClosed, tasksUnassigned, docsAccessRevoked };
}

/**
 * Finalize everyone whose last working day has fully passed but who is still active
 * (scheduled offboardings). Called by the daily cron and once on boot.
 */
export async function finalizeDueOffboardings(): Promise<number> {
  const today = todayIST();
  const due = await User.findAll({
    where: { status: "active", exitDate: { [Op.lt]: today } },
  });

  for (const user of due) {
    try {
      await finalizeOffboarding(user);
      console.log(`[Offboarding] Finalized exit for ${user.fullName} (last working day ${user.exitDate}).`);
    } catch (err: any) {
      console.error(`[Offboarding] Failed to finalize ${user.id}:`, err.message);
    }
  }

  return due.length;
}
