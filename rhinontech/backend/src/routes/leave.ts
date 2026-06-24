import { Router, Response } from "express";
import { Op } from "sequelize";
import { LeaveType, LeaveBalance, LeaveRequest, User } from "../models";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

function canManageLeave(req: AuthRequest) {
  return req.user?.roleSlug === "superadmin" || req.user?.roleSlug === "hr";
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0) days++; // skip Sundays
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// GET /leave/types
router.get("/types", async (req: AuthRequest, res: Response) => {
  try {
    const types = await LeaveType.findAll({ order: [["name", "ASC"]] });
    res.json(types);
  } catch {
    res.status(500).json({ message: "Failed to fetch leave types" });
  }
});

// POST /leave/types
router.post("/types", async (req: AuthRequest, res: Response) => {
  try {
    if (!canManageLeave(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    const { name, daysPerYear, color, isPaid, description } = req.body;
    const type = await LeaveType.create({ name, daysPerYear, color, isPaid, description });
    res.json(type);
  } catch {
    res.status(500).json({ message: "Failed to create leave type" });
  }
});

// PUT /leave/types/:id
router.put("/types/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!canManageLeave(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    const type = await LeaveType.findByPk(req.params.id);
    if (!type) { res.status(404).json({ message: "Leave type not found" }); return; }
    const { name, daysPerYear, color, isPaid, description } = req.body;
    await type.update({ name, daysPerYear, color, isPaid, description });
    res.json(type);
  } catch {
    res.status(500).json({ message: "Failed to update leave type" });
  }
});

// DELETE /leave/types/:id
router.delete("/types/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!canManageLeave(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    const type = await LeaveType.findByPk(req.params.id);
    if (!type) { res.status(404).json({ message: "Leave type not found" }); return; }
    await type.destroy();
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete leave type" });
  }
});

// GET /leave/balance — my balances for current year
router.get("/balance", async (req: AuthRequest, res: Response) => {
  try {
    const year = new Date().getFullYear();
    const userId = req.user!.userId;
    const types = await LeaveType.findAll({ order: [["name", "ASC"]] });
    const balances = await LeaveBalance.findAll({ where: { userId, year } });
    const balanceMap = new Map(balances.map(b => [b.leaveTypeId, b]));

    const result = types.map(type => {
      const bal = balanceMap.get(type.id);
      return {
        leaveTypeId: type.id,
        name: type.name,
        color: type.color,
        isPaid: type.isPaid,
        daysPerYear: type.daysPerYear,
        allocated: bal ? bal.allocated : type.daysPerYear,
        used: bal ? bal.used : 0,
        remaining: (bal ? bal.allocated : type.daysPerYear) - (bal ? bal.used : 0),
      };
    });

    res.json(result);
  } catch {
    res.status(500).json({ message: "Failed to fetch balance" });
  }
});

// GET /leave/team/balance — all employees' balances (admin only)
router.get("/team/balance", async (req: AuthRequest, res: Response) => {
  try {
    if (!canManageLeave(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    const year = new Date().getFullYear();
    const types = await LeaveType.findAll({ order: [["name", "ASC"]] });
    const employees = await User.findAll({
      where: { status: "active" },
      attributes: ["id", "fullName", "department"],
      order: [["fullName", "ASC"]],
    });
    const allBalances = await LeaveBalance.findAll({ where: { year } });
    const balanceMap = new Map(allBalances.map(b => [`${b.userId}:${b.leaveTypeId}`, b]));

    const result = employees.map(emp => ({
      userId: emp.id,
      fullName: emp.fullName,
      department: emp.department,
      balances: types.map(type => {
        const bal = balanceMap.get(`${emp.id}:${type.id}`);
        return {
          leaveTypeId: type.id,
          name: type.name,
          color: type.color,
          allocated: bal ? bal.allocated : type.daysPerYear,
          used: bal ? bal.used : 0,
          remaining: (bal ? bal.allocated : type.daysPerYear) - (bal ? bal.used : 0),
        };
      }),
    }));

    res.json(result);
  } catch {
    res.status(500).json({ message: "Failed to fetch team balances" });
  }
});

// GET /leave/requests
router.get("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (!canManageLeave(req)) {
      where.userId = req.user!.userId;
    }
    const requests = await LeaveRequest.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["fullName", "department"] },
        { model: LeaveType, as: "leaveType", attributes: ["name", "color"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(requests.map(r => ({
      ...r.toJSON(),
      userName: (r as any).user?.fullName,
      department: (r as any).user?.department,
      leaveTypeName: (r as any).leaveType?.name,
      leaveTypeColor: (r as any).leaveType?.color,
    })));
  } catch {
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
});

// POST /leave/requests
router.post("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const userId = req.user!.userId;
    const year = new Date(startDate).getFullYear();
    const days = calculateDays(startDate, endDate);

    if (days <= 0) {
      res.status(400).json({ message: "Invalid date range" });
      return;
    }

    const type = await LeaveType.findByPk(leaveTypeId);
    if (!type) { res.status(404).json({ message: "Leave type not found" }); return; }

    const [balance] = await LeaveBalance.findOrCreate({
      where: { userId, leaveTypeId, year },
      defaults: { userId, leaveTypeId, year, allocated: type.daysPerYear, used: 0 },
    });

    const remaining = balance.allocated - balance.used;
    if (days > remaining) {
      res.status(400).json({ message: `Insufficient balance. Remaining: ${remaining} days` });
      return;
    }

    const request = await LeaveRequest.create({ userId, leaveTypeId, startDate, endDate, days, reason });
    res.json(request);
  } catch {
    res.status(500).json({ message: "Failed to create leave request" });
  }
});

// PUT /leave/requests/:id/action
router.put("/requests/:id/action", async (req: AuthRequest, res: Response) => {
  try {
    if (!canManageLeave(req)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    const { status, managerNote } = req.body;
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request) { res.status(404).json({ message: "Request not found" }); return; }

    if (status === "Approved") {
      const year = new Date(request.startDate).getFullYear();
      const type = await LeaveType.findByPk(request.leaveTypeId);
      const [balance] = await LeaveBalance.findOrCreate({
        where: { userId: request.userId, leaveTypeId: request.leaveTypeId, year },
        defaults: {
          userId: request.userId,
          leaveTypeId: request.leaveTypeId,
          year,
          allocated: type ? type.daysPerYear : 0,
          used: 0,
        },
      });
      await balance.update({ used: balance.used + request.days });
    }

    await request.update({ status, managerNote, processedById: req.user!.userId });
    res.json(request);
  } catch {
    res.status(500).json({ message: "Failed to process request" });
  }
});

// DELETE /leave/requests/:id
router.delete("/requests/:id", async (req: AuthRequest, res: Response) => {
  try {
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request) { res.status(404).json({ message: "Request not found" }); return; }
    if (request.userId !== req.user!.userId) {
      res.status(403).json({ message: "Cannot delete another user's request" });
      return;
    }
    if (request.status !== "Pending") {
      res.status(400).json({ message: "Can only delete pending requests" });
      return;
    }
    await request.destroy();
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete request" });
  }
});

// GET /leave/calendar?month=&year=
router.get("/calendar", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const requests = await LeaveRequest.findAll({
      where: {
        status: "Approved",
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: endDate },
          },
        ],
      },
      include: [
        { model: User, as: "user", attributes: ["fullName", "department"] },
        { model: LeaveType, as: "leaveType", attributes: ["name", "color"] },
      ],
    });

    res.json(requests.map(r => ({
      ...r.toJSON(),
      userName: (r as any).user?.fullName,
      department: (r as any).user?.department,
      leaveTypeName: (r as any).leaveType?.name,
      leaveTypeColor: (r as any).leaveType?.color,
    })));
  } catch {
    res.status(500).json({ message: "Failed to fetch calendar data" });
  }
});

export default router;
