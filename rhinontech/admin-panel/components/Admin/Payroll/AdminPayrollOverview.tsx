"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import {
  TbUsers,
  TbCash,
  TbCalendarStats,
  TbChevronRight,
  TbChartPie,
  TbLoader2,
  TbCheck,
} from "react-icons/tb";
import { MdOutlinePlayCircle } from "react-icons/md";

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: "draft" | "processed" | "paid";
  totalGross: number;
  totalNet: number;
  processedAt?: string;
  processedBy?: { fullName: string };
}

interface InvestmentSummary {
  totalGrossPaid: number;
  totalNetPaid: number;
  totalEmployerPfPaid: number;
  totalCompanyCostPaid: number;
  monthlyCommittedGross: number;
  paidPayslipCount: number;
  activeEmployeeCount: number;
  activeSalaryEmployeeCount: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-amber-100 text-amber-700",
  processed: "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
};

const INR = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
      <div className="p-2 bg-gray-50 rounded-lg text-gray-600">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-base font-semibold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AdminPayrollOverview() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [investment, setInvestment] = useState<InvestmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const fetchRuns = () => {
    const token = Cookies.get("authToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/runs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setRuns(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchInvestment = () => {
    const token = Cookies.get("authToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/investment`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setInvestment(data && !data.message ? data : null))
      .catch(() => {});
  };

  useEffect(() => {
    fetchRuns();
    fetchInvestment();
  }, []);

  const markPaid = async (id: string) => {
    setMarkingPaid(id);
    const token = Cookies.get("authToken");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/runs/${id}/pay`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMarkingPaid(null);
    fetchRuns();
    fetchInvestment();
  };

  const latest = runs[0];
  const lastPaid = runs.find((r) => r.status === "paid");
  const totalLastMonth = latest ? Number(latest.totalNet) : 0;
  const pendingCount = runs.filter((r) => r.status !== "paid").length;

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-5 border-b bg-stone-50">
        <div className="flex items-center gap-4">
          <SubNavToggle />
          <h1 className="text-base font-semibold tracking-tight">Payroll Dashboard</h1>
        </div>
        <Link
          href={`/${roleSlug}/payroll/run`}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
        >
          <MdOutlinePlayCircle size={16} /> Run Payroll
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<TbCalendarStats size={20} />} label="Last Run" value={latest ? `${MONTHS[latest.month - 1]} ${latest.year}` : "—"} sub={latest ? latest.status.toUpperCase() : undefined} />
          <StatCard icon={<TbCash size={20} />} label="Net Payout (Latest)" value={totalLastMonth ? INR(totalLastMonth) : "—"} />
          <StatCard icon={<TbUsers size={20} />} label="Pending Runs" value={String(pendingCount)} sub={pendingCount > 0 ? "Need attention" : "All paid"} />
          <StatCard icon={<TbCheck size={20} />} label="Last Paid Run" value={lastPaid ? `${MONTHS[lastPaid.month - 1]} ${lastPaid.year}` : "—"} />
        </div>

        <div className="mb-8 rounded-xl border border-gray-100 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <TbChartPie size={18} className="text-gray-500" />
              <p className="font-semibold text-gray-900">Company Investment</p>
            </div>
            <p className="text-xs text-gray-400">{investment ? `${investment.activeSalaryEmployeeCount} salaried employees` : "Loading..."}</p>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 divide-x divide-gray-100">
            <div className="p-5">
              <p className="text-sm text-gray-500">Total invested</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{investment ? INR(investment.totalCompanyCostPaid) : "—"}</p>
              <p className="mt-1 text-xs text-gray-400">Gross salary + employer PF paid</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500">Salary credited</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{investment ? INR(investment.totalNetPaid) : "—"}</p>
              <p className="mt-1 text-xs text-gray-400">{investment ? `${investment.paidPayslipCount} paid payslips` : "Paid payroll only"}</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500">Employer PF</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{investment ? INR(investment.totalEmployerPfPaid) : "—"}</p>
              <p className="mt-1 text-xs text-gray-400">Company contribution paid</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500">Monthly commitment</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{investment ? INR(investment.monthlyCommittedGross) : "—"}</p>
              <p className="mt-1 text-xs text-gray-400">{investment ? `${investment.activeEmployeeCount} active employees` : "Current salary setup"}</p>
            </div>
          </div>
        </div>

        {/* Payroll runs table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <p className="font-semibold text-gray-900">Payroll Runs</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
          ) : runs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-500 font-medium">No payroll runs yet</p>
              <p className="text-xs text-gray-400 mt-1">Use "Run Payroll" to generate the first month.</p>
              <Link href={`/${roleSlug}/payroll/run`} className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800">
                <MdOutlinePlayCircle size={14} /> Run First Payroll
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Period</th>
                  <th className="px-5 py-3 text-right">Total Gross</th>
                  <th className="px-5 py-3 text-right">Total Net</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Processed By</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium">{MONTHS[run.month - 1]} {run.year}</td>
                    <td className="px-5 py-3 text-right">₹{Number(run.totalGross).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3 text-right font-semibold">₹{Number(run.totalNet).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[run.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{run.processedBy?.fullName ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${roleSlug}/payroll/payslips?run=${run.id}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          View <TbChevronRight size={12} />
                        </Link>
                        {run.status !== "paid" && (
                          <button
                            onClick={() => markPaid(run.id)}
                            disabled={markingPaid === run.id}
                            className="flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            {markingPaid === run.id ? <TbLoader2 size={12} className="animate-spin" /> : <TbCheck size={12} />}
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
