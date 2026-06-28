import { DocsAccessManager } from "@/components/Admin/DocsAccess/DocsAccessManager";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";

export default function DocsAccessPage() {
  return (
    <AdminDashboardShell>
      <DocsAccessManager />
    </AdminDashboardShell>
  );
}
