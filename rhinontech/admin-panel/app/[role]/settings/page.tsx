import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { SettingsRoles } from "@/components/Admin/Settings/SettingsRoles";

export default function SettingsPage() {
  return (
    <AdminDashboardShell>
      <SettingsRoles />
    </AdminDashboardShell>
  );
}
