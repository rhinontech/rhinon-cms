"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TbFileInvoice, TbDownload, TbEye, TbCircleCheck, TbUserMinus } from "react-icons/tb";
import { toast } from "sonner";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePermissions } from "@/context/PermissionsContext";

interface Payslip {
  id: string;
  netPay: number;
  grossPay: number;
  totalDeductions: number;
  status: string;
  type?: "regular" | "fnf";
  payroll: { month: number; year: number; status: string };
  employee?: { fullName: string; companyEmail: string; department: string; exitDate?: string | null };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function PayslipsList() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const { has } = usePermissions();
  const isAdminView = has("payroll:write");
  const [payingId, setPayingId] = useState<string | null>(null);
  const router = useRouter();

  // Leaver whose last working day falls in/before this payslip's month → pay via F&F instead
  const isLeaverSlip = (slip: Payslip) => {
    if (!slip.employee?.exitDate || slip.status === "paid" || slip.type === "fnf") return false;
    const { month, year } = slip.payroll;
    const end = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
    return slip.employee.exitDate <= end;
  };

  const moveToSettlement = async (slip: Payslip) => {
    if (!confirm(`Remove ${slip.employee?.fullName}'s payslip from this payroll and run a final settlement instead?`)) return;
    const token = document.cookie.split("; ").find((row) => row.startsWith("authToken="))?.split("=")[1];
    setPayingId(slip.id);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/payslips/${slip.id}/move-to-settlement`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Failed to move payslip");
      toast.success(data.message);
      router.push(`/${roleSlug}/payroll/settlements`);
    } catch (e) {
      toast.error((e as Error).message);
      setPayingId(null);
    }
  };

  const markPaid = async (slip: Payslip) => {
    if (!confirm(`Mark ${slip.employee?.fullName ?? "this"} payslip as paid? The employee will be emailed.`)) return;
    const token = document.cookie.split("; ").find((row) => row.startsWith("authToken="))?.split("=")[1];
    setPayingId(slip.id);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/admin/payslips/${slip.id}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Failed to mark paid");
      setPayslips((prev) => prev.map((p) => (p.id === slip.id ? { ...p, status: "paid" } : p)));
      toast.success("Payslip marked as paid");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPayingId(null);
    }
  };

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];
    const runId = new URLSearchParams(window.location.search).get("run");
    const params = new URLSearchParams();
    if (runId) params.set("run", runId);
    const endpoint = isAdminView
      ? `/payroll/admin/payslips${params.toString() ? `?${params.toString()}` : ""}`
      : "/payroll/me/payslips";

    fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setPayslips(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdminView]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted rounded-r-xl">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-muted">
        <SubNavToggle />
        <h1 className="text-base font-semibold tracking-tight">Payslips</h1>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : payslips.length === 0 ? (
          <div className="glass-card-solid rounded-xl p-12 text-center text-muted-foreground text-sm">No payslips found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {payslips.map((slip) => (
              <div key={slip.id} className="glass-card-solid rounded-xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-400/10 rounded-lg text-blue-600 dark:text-blue-300"><TbFileInvoice size={20} /></div>
                  <div>
                    <p className="font-medium text-foreground">{MONTHS[slip.payroll.month - 1]} {slip.payroll.year}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAdminView && slip.employee ? `${slip.employee.fullName} · ` : ""}
                      Net ₹{Number(slip.netPay).toLocaleString("en-IN")} · Gross ₹{Number(slip.grossPay).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${slip.status === "paid" ? "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300" : "bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300"}`}>
                    {slip.status}
                  </span>
                  {isAdminView && isLeaverSlip(slip) ? (
                    <button
                      onClick={() => moveToSettlement(slip)}
                      disabled={payingId === slip.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-400/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-400/10 transition-colors disabled:opacity-50"
                    >
                      <TbUserMinus size={14} /> {payingId === slip.id ? "Moving…" : "Run Settlement"}
                    </button>
                  ) : isAdminView && slip.status !== "paid" && (
                    <button
                      onClick={() => markPaid(slip)}
                      disabled={payingId === slip.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 border border-green-300 dark:border-green-400/30 rounded-lg hover:bg-green-50 dark:hover:bg-green-400/10 transition-colors disabled:opacity-50"
                    >
                      <TbCircleCheck size={14} /> {payingId === slip.id ? "Marking…" : "Mark Paid"}
                    </button>
                  )}
                  <Link href={`/${roleSlug}/payroll/payslips/${slip.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground/85 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                    <TbEye size={14} /> View
                  </Link>
                  <Link href={`/${roleSlug}/payroll/payslips/${slip.id}?download=1`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground/85 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                    <TbDownload size={14} /> Download
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
