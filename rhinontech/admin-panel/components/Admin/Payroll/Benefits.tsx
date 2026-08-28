"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { TbHome2, TbBus, TbHeartPlus, TbPlus, TbGift } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";

interface Payslip {
  hra: number;
  ta: number;
  medicalAllowance: number;
  otherAllowances: number;
  payroll: { month: number; year: number };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function Benefits() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("authToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/me/payslips`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setPayslips)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const latest = payslips[0];
  const allItems = latest
    ? [
        { label: "HRA",               icon: TbHome2,    value: Number(latest.hra),              color: "bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300"   },
        { label: "Transport (TA)",     icon: TbBus,      value: Number(latest.ta),               color: "bg-green-50 dark:bg-green-400/10 text-green-600 dark:text-green-300" },
        { label: "Medical Allowance",  icon: TbHeartPlus,value: Number(latest.medicalAllowance), color: "bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-300"     },
        { label: "Other Allowances",   icon: TbPlus,     value: Number(latest.otherAllowances),  color: "bg-purple-50 dark:bg-purple-400/10 text-purple-600 dark:text-purple-300"},
      ]
    : [];
  const hasAllowances = allItems.some((i) => i.value > 0);
  const items = allItems;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted rounded-r-xl">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b bg-muted">
        <SubNavToggle />
        <h1 className="text-base font-semibold tracking-tight">Benefits & Allowances</h1>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !latest ? (
          <div className="glass-card-solid rounded-xl p-12 text-center text-muted-foreground text-sm">No benefit data yet.</div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">{MONTHS[latest.payroll.month - 1]} {latest.payroll.year}</p>
            {hasAllowances ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 xl:grid-cols-4">
                  {items.map((item) => (
                    <div key={item.label} className="glass-card-solid rounded-xl p-5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>
                        <item.icon size={18} />
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">{item.label}</p>
                      <p className="text-base font-semibold text-foreground mt-1">₹{item.value.toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
                <div className="glass-card-solid rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b"><p className="font-medium text-foreground">Allowance History</p></div>
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="glass-thead text-foreground/70 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Period</th>
                        <th className="px-4 py-3 text-right">HRA</th>
                        <th className="px-4 py-3 text-right">TA</th>
                        <th className="px-4 py-3 text-right">Medical</th>
                        <th className="px-4 py-3 text-right">Others</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payslips.map((s, i) => (
                        <tr key={i} className="hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium">{MONTHS[s.payroll.month - 1]} {s.payroll.year}</td>
                          <td className="px-4 py-3 text-right">₹{Number(s.hra).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-right">₹{Number(s.ta).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-right">₹{Number(s.medicalAllowance).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-right">₹{Number(s.otherAllowances).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="glass-card-solid rounded-xl p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <TbGift size={22} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground/85 mb-1">No allowances configured</p>
                <p className="text-xs text-muted-foreground">Your package is base salary only. Allowances will appear here once added.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
