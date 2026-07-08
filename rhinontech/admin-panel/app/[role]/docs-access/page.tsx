import { DocsAccessManager } from "@/components/Admin/DocsAccess/DocsAccessManager";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";

export default function DocsAccessPage() {
  return (
    <AdminDashboardShell>
      <div className="glass-panel rounded-xl w-full h-full overflow-auto">
        <DocsAccessManager />
      </div>
    </AdminDashboardShell>
  );
}
