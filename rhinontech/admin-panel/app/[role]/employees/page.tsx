import { PeopleDirectory } from "@/components/Admin/People/PeopleDirectory";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";

export default function EmployeesPage() {
  return (
    <AdminDashboardShell>
      <PeopleDirectory />
    </AdminDashboardShell>
  );
}
