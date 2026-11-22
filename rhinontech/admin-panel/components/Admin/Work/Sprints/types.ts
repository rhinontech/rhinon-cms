/** Shared shapes for the Work → Sprints board. */

export type SprintStatus = "planning" | "active" | "completed";

export interface ApiSprint {
  id: string;
  name: string;
  goal: string | null;
  projectId: string | null;
  teamId: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  taskCount: number;
  doneCount: number;
  project: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  creator: { id: string; fullName: string } | null;
}

export interface SprintTask {
  id: string;
  title: string;
  status: "Pending" | "In progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: string | null;
  projectId: string | null;
  sprintId: string | null;
  assignee: { id: string; fullName: string } | null;
  project: { id: string; name: string } | null;
}

export interface SprintFormState {
  name: string;
  goal: string;
  projectId: string;
  teamId: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
}

export function emptySprintForm(): SprintFormState {
  const today = new Date();
  const in14 = new Date(today);
  in14.setDate(in14.getDate() + 14);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { name: "", goal: "", projectId: "", teamId: "", startDate: iso(today), endDate: iso(in14), status: "planning" };
}
