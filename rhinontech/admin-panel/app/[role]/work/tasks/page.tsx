import { Suspense } from "react";
import { TasksPage } from "@/components/Admin/Work/Tasks/TasksPage";

// TasksPage reads ?scope= via useSearchParams, which needs a Suspense boundary
// or Next opts the whole route into dynamic rendering.
export default function WorkTasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPage />
    </Suspense>
  );
}
