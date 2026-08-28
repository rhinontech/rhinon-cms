import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

/**
 * "guest" is an external collaborator — a client or contractor reachable only
 * through an explicit ProjectMember grant. Guests are Users so that task
 * assignment and comments work unchanged, which means every internal listing
 * has to exclude them deliberately.
 */
export type UserType = "internal" | "guest";

export type UserStatus = "active" | "inactive";

export type ExitReason =
  | "Resignation"
  | "Termination"
  | "Contract ended"
  | "Absconded"
  | "Other";

interface UserAttributes {
  id: string;
  userType: UserType;
  fullName: string;
  personalEmail: string;
  companyEmail: string;
  passwordHash: string;
  roleId: string;
  department: string;
  status: UserStatus;
  joiningDate: Date;
  dateOfBirth?: Date;
  // Offboarding — exitDate is the last working day; status flips to inactive once it passes
  exitDate?: Date | null;
  exitReason?: ExitReason | null;
  exitNotes?: string | null;
  exitChecklist?: Record<string, boolean> | null;
  // HR / employment info
  pan?: string;
  employmentType?: string;
  compensationType?: string;
  workSchedule?: string;
  remotePosition?: boolean;
  workLocation?: string;
  paymentFrequency?: string;
  legalName?: string;
  roleTitle?: string;
  annualCompensation?: number;
  annualVariablePay?: number;
  pastPayrollFinancialYear?: string;
  pastTaxableSalary?: number;
  pastTdsDeducted?: number;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankBeneficiaryName?: string;
  pfUanNumber?: string;
  esicIpNumber?: string;
  labourWelfareFundEnabled?: boolean;
  npsEnabled?: boolean;
  professionalTaxEnabled?: boolean;
  // Salary structure (monthly amounts, set by admin — used to auto-generate payslips)
  basicSalary?: number;
  hra?: number;
  ta?: number;
  medicalAllowance?: number;
  otherAllowances?: number;
  // Deduction config — overrides defaults when set
  pfEnabled?: boolean;   // default true (12% of basic)
  ptAmount?: number;     // default 200 — set 0 to disable
  tdsAmount?: number;    // default 0 — manual monthly TDS override
  // Assets
  avatarKey?: string | null;
  // Onboarding
  onboardingToken?: string | null;
  onboardingTokenExpiry?: Date | null;
  onboarded?: boolean;
  // Password reset
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "userType"
    | "companyEmail"
    | "status"
    | "dateOfBirth"
    | "exitDate"
    | "exitReason"
    | "exitNotes"
    | "exitChecklist"
    | "pan"
    | "employmentType"
    | "compensationType"
    | "workSchedule"
    | "remotePosition"
    | "workLocation"
    | "paymentFrequency"
    | "legalName"
    | "roleTitle"
    | "annualCompensation"
    | "annualVariablePay"
    | "pastPayrollFinancialYear"
    | "pastTaxableSalary"
    | "pastTdsDeducted"
    | "bankAccountNumber"
    | "bankIfscCode"
    | "bankBeneficiaryName"
    | "pfUanNumber"
    | "esicIpNumber"
    | "labourWelfareFundEnabled"
    | "npsEnabled"
    | "professionalTaxEnabled"
    | "basicSalary"
    | "hra"
    | "ta"
    | "medicalAllowance"
    | "otherAllowances"
    | "pfEnabled"
    | "ptAmount"
    | "tdsAmount"
    | "avatarKey"
    | "onboardingToken"
    | "onboardingTokenExpiry"
    | "onboarded"
    | "resetToken"
    | "resetTokenExpiry"
  > {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare userType: UserType;
  declare fullName: string;
  declare personalEmail: string;
  declare companyEmail: string;
  declare passwordHash: string;
  declare roleId: string;
  declare department: string;
  declare status: UserStatus;
  declare joiningDate: Date;
  declare dateOfBirth: Date;
  declare exitDate: Date | null;
  declare exitReason: ExitReason | null;
  declare exitNotes: string | null;
  declare exitChecklist: Record<string, boolean> | null;
  declare pan: string;
  declare employmentType: string;
  declare compensationType: string;
  declare workSchedule: string;
  declare remotePosition: boolean;
  declare workLocation: string;
  declare paymentFrequency: string;
  declare legalName: string;
  declare roleTitle: string;
  declare annualCompensation: number;
  declare annualVariablePay: number;
  declare pastPayrollFinancialYear: string;
  declare pastTaxableSalary: number;
  declare pastTdsDeducted: number;
  declare bankAccountNumber: string;
  declare bankIfscCode: string;
  declare bankBeneficiaryName: string;
  declare pfUanNumber: string;
  declare esicIpNumber: string;
  declare labourWelfareFundEnabled: boolean;
  declare npsEnabled: boolean;
  declare professionalTaxEnabled: boolean;
  declare basicSalary: number;
  declare hra: number;
  declare ta: number;
  declare medicalAllowance: number;
  declare otherAllowances: number;
  declare pfEnabled: boolean;
  declare ptAmount: number;
  declare tdsAmount: number;
  declare avatarKey: string | null;
  declare onboardingToken: string | null;
  declare onboardingTokenExpiry: Date | null;
  declare onboarded: boolean;
  declare resetToken: string | null;
  declare resetTokenExpiry: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userType: { type: DataTypes.ENUM("internal", "guest"), allowNull: false, defaultValue: "internal" },
    fullName: { type: DataTypes.STRING, allowNull: false },
    personalEmail: { type: DataTypes.STRING, allowNull: false, unique: true },
    companyEmail: { type: DataTypes.STRING, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    roleId: { type: DataTypes.UUID, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
    joiningDate: { type: DataTypes.DATEONLY, allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    exitDate: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null },
    exitReason: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    exitNotes: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    exitChecklist: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
    pan: { type: DataTypes.STRING(10), allowNull: true },
    employmentType: { type: DataTypes.STRING, allowNull: true, defaultValue: "Full-Time" },
    compensationType: { type: DataTypes.STRING, allowNull: true, defaultValue: "Salaried" },
    workSchedule: { type: DataTypes.STRING, allowNull: true, defaultValue: "11 AM – 8 PM (Mon–Sat)" },
    remotePosition: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    workLocation: { type: DataTypes.STRING, allowNull: true },
    paymentFrequency: { type: DataTypes.STRING, allowNull: true, defaultValue: "Monthly" },
    legalName: { type: DataTypes.STRING, allowNull: true },
    roleTitle: { type: DataTypes.STRING, allowNull: true },
    annualCompensation: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    annualVariablePay: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    pastPayrollFinancialYear: { type: DataTypes.STRING, allowNull: true },
    pastTaxableSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    pastTdsDeducted: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    bankAccountNumber: { type: DataTypes.STRING, allowNull: true },
    bankIfscCode: { type: DataTypes.STRING, allowNull: true },
    bankBeneficiaryName: { type: DataTypes.STRING, allowNull: true },
    pfUanNumber: { type: DataTypes.STRING, allowNull: true },
    esicIpNumber: { type: DataTypes.STRING, allowNull: true },
    labourWelfareFundEnabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    npsEnabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    professionalTaxEnabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    hra: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    ta: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    medicalAllowance: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    otherAllowances: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    pfEnabled:  { type: DataTypes.BOOLEAN,       allowNull: true, defaultValue: true },
    ptAmount:   { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 200 },
    tdsAmount:  { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0   },
    avatarKey:             { type: DataTypes.STRING,  allowNull: true, defaultValue: null },
    onboardingToken:       { type: DataTypes.STRING,  allowNull: true, defaultValue: null },
    onboardingTokenExpiry: { type: DataTypes.DATE,    allowNull: true, defaultValue: null },
    onboarded:             { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    resetToken:            { type: DataTypes.STRING,  allowNull: true, defaultValue: null },
    resetTokenExpiry:      { type: DataTypes.DATE,    allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    /**
     * NO defaultScope here, deliberately.
     *
     * An earlier version excluded guests with `defaultScope: { where: { userType:
     * "internal" } }`. Sequelize promotes any include carrying a `where` to
     * `required: true`, so that scope silently turned all 38 `User` includes in
     * the app into INNER JOINs — and every row with a nullable user FK (a project
     * with no owner, an unassigned task) vanished from its list with no error.
     *
     * Guests are excluded explicitly at the listing endpoints instead. That can
     * only ever leak a guest into a roster; the scope could delete real data from
     * any query in the system.
     */
  }
);
