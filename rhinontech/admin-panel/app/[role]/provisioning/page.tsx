import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";

export default function ProvisioningPage() {
  return (
    <AdminDashboardShell>
      <div className="bg-white rounded-xl p-6 w-full h-full">
        <h1 className="text-base font-semibold text-gray-900">Provisioning</h1>
        <p className="text-sm text-gray-500 mt-1">Manage tool access for employees</p>
      </div>
    </AdminDashboardShell>
  );
}
