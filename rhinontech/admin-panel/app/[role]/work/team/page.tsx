import { redirect } from "next/navigation";

export default function TeamTasksRedirect() {
  redirect("../tasks?scope=team");
}
