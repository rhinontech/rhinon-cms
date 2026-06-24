"use client";

import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { CollapsibleSubNav } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { SideNavProvider } from "@/context/SideNavContext";
import { usePathname } from "next/navigation";
import {
  MdOutlineDashboard,
  MdOutlinePeopleAlt,
  MdOutlinePlayCircle,
} from "react-icons/md";
import {
  TbFileInvoice,
  TbArrowsTransferDown,
  TbGift,
  TbId,
  TbFilePlus,
} from "react-icons/tb";

function PayrollLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const base = `/${roleSlug}/payroll`;
  const isAdminView = roleSlug === "superadmin" || roleSlug === "hr";

  const adminItems = [
    { label: "Dashboard",     href: `${base}/overview`,  icon: <MdOutlineDashboard size={18} /> },
    { label: "Employees",     href: `${base}/employees`, icon: <MdOutlinePeopleAlt size={18} /> },
    { label: "Run Payroll",   href: `${base}/run`,       icon: <MdOutlinePlayCircle size={18} /> },
    { label: "Payslip Entry", href: `${base}/entry`,     icon: <TbFilePlus size={18} /> },
    { label: "All Payslips",  href: `${base}/payslips`,  icon: <TbFileInvoice size={18} /> },
  ];

  const employeeItems = [
    { label: "Overview",       href: `${base}/overview`,   icon: <MdOutlineDashboard size={18} /> },
    { label: "My Payslips",    href: `${base}/payslips`,   icon: <TbFileInvoice size={18} /> },
    { label: "Salary Details", href: `${base}/salary`,     icon: <TbId size={18} /> },
    { label: "Deductions",     href: `${base}/deductions`, icon: <TbArrowsTransferDown size={18} /> },
    { label: "Benefits",       href: `${base}/benefits`,   icon: <TbGift size={18} /> },
  ];

  const items = isAdminView ? adminItems : employeeItems;

  return (
    <div className="flex w-full h-full">
      <CollapsibleSubNav title="Payroll" items={items} />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </div>
  );
}

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardShell>
      <SideNavProvider>
        <PayrollLayoutContent>{children}</PayrollLayoutContent>
      </SideNavProvider>
    </AdminDashboardShell>
  );
}
