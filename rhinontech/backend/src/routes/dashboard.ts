import { Router, Response } from "express";
import { Op } from "sequelize";
import { User, Role, Task, Attendance } from "../models";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

function durationMinutes(clockIn: Date | null | undefined, clockOut: Date | null | undefined): number {
  if (!clockIn) return 0;
  const end = clockOut ? new Date(clockOut) : new Date();
  return Math.max(0, Math.round((end.getTime() - new Date(clockIn).getTime()) / 60000));
}

// GET /dashboard/stats
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const currentMonth = now.getMonth() + 1;
    const today = now.toISOString().split("T")[0];

    // Employee counts
    const totalEmployees = await User.count({ where: { status: "active" } });
    const newThisMonth = await User.count({
      where: { status: "active", joiningDate: { [Op.between]: [startOfMonth, endOfMonth] } },
    });

    // Today's attendance for the current user
    const todayRecord = await Attendance.findOne({
      where: { userId: req.user!.userId, date: today },
    });

    // This month's attendance for the current user
    const monthAttendance = await Attendance.findAll({
      where: {
        userId: req.user!.userId,
        date: { [Op.between]: [startOfMonth, endOfMonth] },
        status: "present",
      },
    });
    const daysPresent = monthAttendance.length;
    let totalMinutesThisMonth = 0;
    for (const r of monthAttendance) {
      totalMinutesThisMonth += durationMinutes(r.clockIn, r.clockOut);
    }

    // Pending tasks count + list
    const pendingTasks = await Task.count({
      where: { assigneeId: req.user!.userId, status: "Pending" },
    });
    const pendingTasksList = await Task.findAll({
      where: { assigneeId: req.user!.userId, status: "Pending" },
      order: [["dueDate", "ASC"]],
      limit: 5,
      attributes: ["id", "title", "team", "dueDate", "status"],
    });

    // All active employees for birthday/anniversary computation
    const allEmployees = await User.findAll({
      where: { status: "active" },
      attributes: ["id", "fullName", "joiningDate", "dateOfBirth", "department"],
      include: [{ model: Role, as: "role", attributes: ["name"] }],
    });

    // Birthdays this month
    const birthdays = allEmployees
      .filter((e) => {
        if (!(e as any).dateOfBirth) return false;
        const dob = new Date((e as any).dateOfBirth);
        return dob.getMonth() + 1 === currentMonth;
      })
      .sort((a, b) => new Date((a as any).dateOfBirth).getDate() - new Date((b as any).dateOfBirth).getDate())
      .map((e) => {
        const dob = new Date((e as any).dateOfBirth);
        const age = now.getFullYear() - dob.getFullYear();
        return {
          id: e.id,
          fullName: e.fullName,
          day: dob.getDate(),
          age,
          role: (e as any).role?.name ?? null,
          department: e.department,
          isToday: dob.getDate() === now.getDate(),
        };
      });

    // Anniversaries this month
    const anniversaries = allEmployees
      .filter((e) => {
        const jd = new Date(e.joiningDate);
        return jd.getMonth() + 1 === currentMonth && jd.getFullYear() < now.getFullYear();
      })
      .sort((a, b) => new Date(a.joiningDate).getDate() - new Date(b.joiningDate).getDate())
      .map((e) => {
        const jd = new Date(e.joiningDate);
        const years = now.getFullYear() - jd.getFullYear();
        return {
          id: e.id,
          fullName: e.fullName,
          day: jd.getDate(),
          years,
          role: (e as any).role?.name ?? null,
          department: e.department,
          isToday: jd.getDate() === now.getDate(),
        };
      });

    // Recent hires (last 60 days, from joiningDate)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentHires = allEmployees
      .filter((e) => new Date(e.joiningDate) >= sixtyDaysAgo)
      .sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime())
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        fullName: e.fullName,
        department: e.department,
        role: (e as any).role?.name ?? null,
        joiningDate: e.joiningDate,
      }));

    // Current user info
    const currentUserRecord = await User.findByPk(req.user!.userId, {
      attributes: ["fullName", "department"],
      include: [{ model: Role, as: "role", attributes: ["name"] }],
    });

    res.json({
      currentUser: {
        fullName: currentUserRecord?.fullName ?? req.user!.fullName,
        department: currentUserRecord?.department ?? "",
        role: (currentUserRecord as any)?.role?.name ?? "",
      },
      totalEmployees,
      newThisMonth,
      pendingTasks,
      daysPresent,
      totalMinutesThisMonth: Math.round(totalMinutesThisMonth),
      todayAttendance: todayRecord
        ? { ...todayRecord.toJSON(), durationMinutes: durationMinutes(todayRecord.clockIn, todayRecord.clockOut) }
        : null,
      birthdays,
      anniversaries,
      recentHires,
      pendingTasksList: pendingTasksList.map((t) => t.toJSON()),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

export default router;
