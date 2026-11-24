import { WorkProjectsPage } from "@/components/Admin/Work/WorkProjectsPage";

/**
 * "Projects" is the list of projects. It used to jump straight into the last
 * project opened, which made it look like a second, different thing from "All
 * projects". The list now offers "Continue" for that last project instead.
 */
export default function WorkProjectsListPage() {
  return <WorkProjectsPage />;
}
