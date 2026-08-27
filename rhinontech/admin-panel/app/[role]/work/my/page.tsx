import { redirect } from "next/navigation";

// My/Team/All tasks were three renderings of one page — now one page with a
// scope chip. Kept so existing bookmarks land on the right filter.
export default function MyTasksRedirect() {
  redirect("../tasks?scope=my");
}
