import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import { User, Role } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { sendEmail } from "../services/mailer";
import { welcomeEmail } from "../services/emailTemplates";
import { uploadBuffer, deleteObject, getPresignedReadUrl, getPresignedUploadUrl } from "../services/storage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(authenticate);

router.get("/", authorize("employees:read"), async (_req: AuthRequest, res: Response) => {
  const employees = await User.findAll({
    include: [{ model: Role, as: "role" }],
    attributes: { exclude: ["passwordHash"] },
  });
  const withAvatars = await Promise.all(
    employees.map(async (e) => {
      const json = e.toJSON() as any;
      if (json.avatarKey) json.avatarUrl = await getPresignedReadUrl(json.avatarKey);
      return json;
    })
  );
  res.json(withAvatars);
});

router.get("/:id", authorize("employees:read"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id, {
    include: [{ model: Role, as: "role" }],
    attributes: { exclude: ["passwordHash"] },
  });
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  const json = employee.toJSON() as any;
  if (json.avatarKey) json.avatarUrl = await getPresignedReadUrl(json.avatarKey);
  res.json(json);
});

const employeeEditableFields = [
  "fullName",
  "personalEmail",
  "roleId",
  "department",
  "status",
  "dateOfBirth",
  "pan",
  "employmentType",
  "compensationType",
  "workSchedule",
  "remotePosition",
  "workLocation",
  "paymentFrequency",
  "legalName",
  "roleTitle",
  "annualCompensation",
  "annualVariablePay",
  "pastPayrollFinancialYear",
  "pastTaxableSalary",
  "pastTdsDeducted",
  "bankAccountNumber",
  "bankIfscCode",
  "bankBeneficiaryName",
  "pfUanNumber",
  "esicIpNumber",
  "labourWelfareFundEnabled",
  "npsEnabled",
  "professionalTaxEnabled",
  "basicSalary",
  "hra",
  "ta",
  "medicalAllowance",
  "otherAllowances",
] as const;

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string" && value.trim().toLowerCase() === "invalid date") return null;

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function employeePayload(body: Record<string, any>) {
  const payload: Record<string, any> = {};
  for (const field of employeeEditableFields) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  const joiningDate = parseOptionalDate(body.joiningDate);
  const dateOfBirth = parseOptionalDate(body.dateOfBirth);
  if (joiningDate !== undefined) payload.joiningDate = joiningDate;
  if (dateOfBirth !== undefined) payload.dateOfBirth = dateOfBirth;
  return payload;
}

router.post("/", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const { fullName, personalEmail, roleId, department, joiningDate, emailPrefix } = req.body;

  if (!fullName || !personalEmail || !roleId || !department || !joiningDate || !emailPrefix) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  // Validate emailPrefix format
  if (!/^[a-z0-9._-]+$/.test(emailPrefix.toLowerCase())) {
    res.status(400).json({ message: "Email prefix can only contain letters, numbers, dots, hyphens, and underscores" });
    return;
  }

  const companyEmail = `${emailPrefix.toLowerCase()}@rhinontech.in`;

  // Check companyEmail uniqueness
  const emailTaken = await User.findOne({ where: { companyEmail } });
  if (emailTaken) {
    res.status(409).json({ message: `${companyEmail} is already taken. Choose a different prefix.` });
    return;
  }

  // Enforce one superadmin
  const role = await Role.findByPk(roleId);
  if (role?.slug === "superadmin") {
    const existing = await User.findOne({ include: [{ model: Role, as: "role", where: { slug: "superadmin" } }] });
    if (existing) {
      res.status(400).json({ message: "A Super Admin already exists. Only one superadmin is allowed." });
      return;
    }
  }

  // Auto-generate temp password and onboarding token
  const tempPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const onboardingToken = crypto.randomUUID();
  const onboardingTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const parsedJoiningDate = parseOptionalDate(joiningDate);
  if (!parsedJoiningDate) {
    res.status(400).json({ message: "A valid joining date is required" });
    return;
  }

  const employee = await User.create({
    fullName,
    personalEmail,
    roleId,
    department,
    joiningDate: parsedJoiningDate,
    companyEmail,
    passwordHash,
    status: req.body.status ?? "active",
    onboardingToken,
    onboardingTokenExpiry,
    onboarded: false,
    ...employeePayload(req.body),
  });

  // Send welcome email (non-fatal)
  try {
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4200";
    const onboardingUrl = `${frontendUrl}/onboard?token=${onboardingToken}`;
    const { subject, html, text } = welcomeEmail({ fullName, companyEmail, tempPassword, onboardingUrl });
    await sendEmail({ to: personalEmail, subject, html, text });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }

  res.status(201).json({
    ...employee.toJSON(),
    passwordHash: undefined,
    onboardingToken: undefined,
  });
});

router.put("/:id", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  // Enforce one superadmin — if changing someone else's role TO superadmin, block it
  if (req.body.roleId) {
    const role = await Role.findByPk(req.body.roleId);
    if (role?.slug === "superadmin" && employee.roleId !== req.body.roleId) {
      const existing = await User.findOne({ include: [{ model: Role, as: "role", where: { slug: "superadmin" } }] });
      if (existing && existing.id !== employee.id) {
        res.status(400).json({ message: "A Super Admin already exists. Only one superadmin is allowed." });
        return;
      }
    }
  }
  await employee.update(employeePayload(req.body));
  res.json({ ...employee.toJSON(), passwordHash: undefined });
});

// Avatar upload
router.put("/:id/avatar", authorize("employees:write"), upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) { res.status(404).json({ message: "Employee not found" }); return; }
  if (!req.file) { res.status(400).json({ message: "No file provided" }); return; }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(req.file.mimetype)) {
    res.status(400).json({ message: "Only JPEG, PNG, and WebP images are allowed" });
    return;
  }

  // Delete old avatar if exists
  if (employee.avatarKey) {
    await deleteObject(employee.avatarKey).catch(() => {});
  }

  const key = await uploadBuffer(req.file.buffer, req.file.originalname, "avatars", req.file.mimetype);
  await employee.update({ avatarKey: key });

  const avatarUrl = await getPresignedReadUrl(key);
  res.json({ avatarUrl });
});

// Document upload (presigned URL — client uploads directly to S3)
router.post("/:id/documents/presign", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const { filename, mimeType } = req.body;
  if (!filename || !mimeType) { res.status(400).json({ message: "filename and mimeType are required" }); return; }

  const employee = await User.findByPk(req.params.id);
  if (!employee) { res.status(404).json({ message: "Employee not found" }); return; }

  const { uploadUrl, key } = await getPresignedUploadUrl("documents", filename, mimeType);
  const readUrl = await getPresignedReadUrl(key);
  res.json({ uploadUrl, key, url: readUrl });
});

// Offboard — mark inactive
router.post("/:id/offboard", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  await employee.update({ status: "inactive" });
  res.json({ message: "Employee offboarded", id: employee.id });
});

export default router;
