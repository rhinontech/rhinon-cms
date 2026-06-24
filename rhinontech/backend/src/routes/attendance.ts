import { Router, Response } from "express";
import { Op } from "sequelize";
import { Attendance, AttendancePolicy, AttendanceRequest, Role, User } from "../models";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function isWeekend(date: Date) {
  return date.getDay() === 0; // Sunday only — Mon–Sat is the work week
}

function durationMinutes(clockIn: Date | null | undefined, clockOut: Date | null | undefined) {
  if (!clockIn) return 0;
  const end = clockOut ? new Date(clockOut) : new Date();
  return Math.max(0, Math.round((end.getTime() - new Date(clockIn).getTime()) / 60000));
}

function canViewTeamAttendance(req: AuthRequest) {
  return req.user?.roleSlug === "superadmin" || req.user?.roleSlug === "hr" || req.user?.permissions.includes("employees:read");
}

function blockSuperadminClock(req: AuthRequest, res: Response) {
  if (req.user?.roleSlug !== "superadmin") return false;
  res.status(403).json({ message: "Super admins manage team attendance and do not clock in." });
  return true;
}

async function activeNonSuperadminUsers() {
  const employees = await User.findAll({
    where: { status: "active" },
    include: [{ model: Role, as: "role" }],
    attributes: ["id", "fullName", "companyEmail", "department", "roleId"],
    order: [["fullName", "ASC"]],
  });

  return employees.filter((employee) => (employee as any).role?.slug !== "superadmin");
}

function teamEmployeeJson(employee: User) {
  const role = (employee as any).role;
  return {
    userId: employee.id,
    fullName: employee.fullName,
    companyEmail: employee.companyEmail,
    department: employee.department,
    roleSlug: role?.slug ?? null,
    roleName: role?.name ?? null,
  };
}

// GET /attendance/team/today
router.get("/team/today", async (req: AuthRequest, res: Response) => {
  try {
    if (!canViewTeamAttendance(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    const today = toDateKey(new Date());
    const employees = await activeNonSuperadminUsers();

    const records = await Attendance.findAll({
      where: {
        userId: { [Op.in]: employees.map((employee) => employee.id) },
        date: today,
      },
    });
    const recordMap = new Map(records.map((record) => [record.userId, record]));

    const rows = employees.map((employee) => {
      const record = recordMap.get(employee.id);
      return {
        ...teamEmployeeJson(employee),
        attendance: record
          ? { ...record.toJSON(), durationMinutes: durationMinutes(record.clockIn, record.clockOut) }
          : { date: today, status: "absent", clockIn: null, clockOut: null, durationMinutes: 0 },
      };
    });

    res.json({
      date: today,
      summary: {
        total: rows.length,
        present: rows.filter((row) => row.attendance.status === "present").length,
        absent: rows.filter((row) => row.attendance.status === "absent").length,
        active: rows.filter((row) => row.attendance.clockIn && !row.attendance.clockOut).length,
      },
      employees: rows,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch team attendance" });
  }
});

// GET /attendance/team?month=5&year=2026
router.get("/team", async (req: AuthRequest, res: Response) => {
  try {
    if (!canViewTeamAttendance(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const todayStr = toDateKey(now);
    const employees = await activeNonSuperadminUsers();
    const employeeIds = employees.map((employee) => employee.id);

    const records = await Attendance.findAll({
      where: {
        userId: { [Op.in]: employeeIds },
        date: { [Op.between]: [startDate, endDate] },
      },
    });
    const recordMap = new Map(records.map((record) => [`${record.userId}:${toDateKey(new Date(record.date))}`, record]));

    const days: string[] = [];
    for (let d = 1; d <= endDate.getDate(); d++) {
      const date = new Date(year, month - 1, d);
      const key = toDateKey(date);
      if (key > todayStr) break;
      days.push(key);
    }

    const rows = employees.map((employee) => {
      let presentDays = 0;
      let totalMinutes = 0;
      const attendance = days.map((date) => {
        const record = recordMap.get(`${employee.id}:${date}`);
        if (record) {
          const minutes = durationMinutes(record.clockIn, record.clockOut);
          if (record.status === "present") presentDays += 1;
          totalMinutes += minutes;
          return { ...record.toJSON(), durationMinutes: minutes };
        }

        const weekend = isWeekend(new Date(`${date}T00:00:00`));
        return {
          id: null,
          userId: employee.id,
          date,
          clockIn: null,
          clockOut: null,
          status: weekend ? "weekend" : "absent",
          note: weekend ? "Weekend" : null,
          durationMinutes: 0,
        };
      });

      return {
        ...teamEmployeeJson(employee),
        presentDays,
        totalMinutes,
        attendance,
      };
    });

    res.json({ month, year, days, employees: rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch team monthly attendance" });
  }
});

// GET /attendance?month=5&year=2026
// Returns a full month view with auto-computed weekend/absent days
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await Attendance.findAll({
      where: {
        userId: req.user!.userId,
        date: { [Op.between]: [startDate, endDate] },
      },
    });

    const recordMap = new Map<string, (typeof records)[0]>();
    for (const r of records) {
      recordMap.set(toDateKey(new Date(r.date)), r);
    }

    const todayStr = toDateKey(now);
    const days = [];
    for (let d = 1; d <= endDate.getDate(); d++) {
      const date = new Date(year, month - 1, d);
      const key = toDateKey(date);
      if (key > todayStr) break; // stop at today
      const existing = recordMap.get(key);

      if (existing) {
        days.push({
          ...existing.toJSON(),
          durationMinutes: durationMinutes(existing.clockIn, existing.clockOut),
        });
      } else {
        const weekend = isWeekend(date);
        days.push({
          id: null,
          userId: req.user!.userId,
          date: key,
          clockIn: null,
          clockOut: null,
          status: weekend ? "weekend" : "absent",
          note: weekend ? "Weekend" : null,
          durationMinutes: 0,
        });
      }
    }

    res.json(days);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

// GET /attendance/today
router.get("/today", async (req: AuthRequest, res: Response) => {
  try {
    const today = toDateKey(new Date());
    const record = await Attendance.findOne({
      where: { userId: req.user!.userId, date: today },
    });

    if (record) {
      res.json({ ...record.toJSON(), durationMinutes: durationMinutes(record.clockIn, record.clockOut) });
    } else {
      res.json({ date: today, status: "absent", clockIn: null, clockOut: null, durationMinutes: 0 });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch today" });
  }
});

// POST /attendance/clock-in
router.post("/clock-in", async (req: AuthRequest, res: Response) => {
  try {
    if (blockSuperadminClock(req, res)) return;

    const today = toDateKey(new Date());
    const now = new Date();

    const [record, created] = await Attendance.findOrCreate({
      where: { userId: req.user!.userId, date: today },
      defaults: {
        userId: req.user!.userId,
        date: new Date(today),
        clockIn: now,
        status: "present",
      },
    });

    if (!created) {
      if (record.clockIn) {
        res.status(400).json({ message: "Already clocked in today" });
        return;
      }
      await record.update({ clockIn: now, status: "present" });
    }

    res.json({ ...record.toJSON(), durationMinutes: durationMinutes(record.clockIn, record.clockOut) });
  } catch (err) {
    res.status(500).json({ message: "Failed to clock in" });
  }
});

// POST /attendance/clock-out
router.post("/clock-out", async (req: AuthRequest, res: Response) => {
  try {
    if (blockSuperadminClock(req, res)) return;

    const today = toDateKey(new Date());
    const now = new Date();

    const record = await Attendance.findOne({
      where: { userId: req.user!.userId, date: today },
    });

    if (!record || !record.clockIn) {
      res.status(400).json({ message: "You haven't clocked in today" });
      return;
    }
    if (record.clockOut) {
      res.status(400).json({ message: "Already clocked out" });
      return;
    }

    await record.update({ clockOut: now });
    res.json({ ...record.toJSON(), durationMinutes: durationMinutes(record.clockIn, record.clockOut) });
  } catch (err) {
    res.status(500).json({ message: "Failed to clock out" });
  }
});

// GET /attendance/stats?month=5&year=2026
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await Attendance.findAll({
      where: {
        userId: req.user!.userId,
        date: { [Op.between]: [startDate, endDate] },
        status: "present",
      },
    });

    const daysPresent = records.length;
    let totalMinutes = 0;
    for (const r of records) {
      totalMinutes += durationMinutes(r.clockIn, r.clockOut);
    }

    const today = toDateKey(now);
    const todayRecord = await Attendance.findOne({
      where: { userId: req.user!.userId, date: today },
    });

    res.json({
      month,
      year,
      daysPresent,
      totalMinutes: Math.round(totalMinutes),
      today: todayRecord
        ? { ...todayRecord.toJSON(), durationMinutes: durationMinutes(todayRecord.clockIn, todayRecord.clockOut) }
        : { date: today, status: "absent", clockIn: null, clockOut: null, durationMinutes: 0 },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// GET /attendance/logs
// Unified log of all attendance records
router.get("/logs", async (req: AuthRequest, res: Response) => {
  try {
    if (!canViewTeamAttendance(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    const employees = await activeNonSuperadminUsers();
    const records = await Attendance.findAll({
      where: { userId: { [Op.in]: employees.map(e => e.id) } },
      include: [{ model: User, as: "user", attributes: ["fullName", "department"] }],
      order: [["date", "DESC"]],
      limit: 100
    });

    res.json(records.map(r => ({
      ...r.toJSON(),
      userName: (r as any).user?.fullName,
      department: (r as any).user?.department,
      durationMinutes: durationMinutes(r.clockIn, r.clockOut),
      overtimeMinutes: Math.max(0, durationMinutes(r.clockIn, r.clockOut) - 540), // Example: OT after 9 hours (540m)
      penalties: [] // Placeholder for penalty logic
    })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// GET /attendance/requests
router.get("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (!canViewTeamAttendance(req)) {
      where.userId = req.user!.userId;
    }
    const requests = await AttendanceRequest.findAll({
      where,
      include: [{ model: User, as: "user", attributes: ["fullName"] }],
      order: [["createdAt", "DESC"]]
    });
    res.json(requests.map(r => ({
      ...r.toJSON(),
      userName: (r as any).user?.fullName
    })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// POST /attendance/requests
router.post("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const { type, date, reason, requestedTime } = req.body;
    const request = await AttendanceRequest.create({
      userId: req.user!.userId,
      type,
      date,
      reason,
      requestedTime
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Failed to create request" });
  }
});

// PUT /attendance/requests/:id
router.put("/requests/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!canViewTeamAttendance(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    const { status } = req.body;
    const request = await AttendanceRequest.findByPk(req.params.id);
    if (!request) {
      res.status(404).json({ message: "Request not found" });
      return;
    }
    await request.update({ status, processedById: req.user!.userId });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Failed to update request" });
  }
});

// GET /attendance/policies
router.get("/policies", async (req: AuthRequest, res: Response) => {
  try {
    const policies = await AttendancePolicy.findAll({
      order: [["title", "ASC"]]
    });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch policies" });
  }
});

// POST /attendance/policies
router.post("/policies", async (req: AuthRequest, res: Response) => {
  try {
    if (!canViewTeamAttendance(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    const { title, category, content, version } = req.body;
    const policy = await AttendancePolicy.create({
      title,
      category,
      content,
      version,
      lastUpdatedById: req.user!.userId
    });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: "Failed to create policy" });
  }
});

export default router;
