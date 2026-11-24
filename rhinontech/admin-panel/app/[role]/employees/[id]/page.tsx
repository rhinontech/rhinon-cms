import { redirect } from "next/navigation";

/** This was an empty placeholder; a person's profile opens inside the HR & People directory. */
export default async function EmployeeProfileRedirect({ params }: { params: Promise<{ role: string; id: string }> }) {
  const { role, id } = await params;
  redirect(`/${role}/employees?person=${encodeURIComponent(id)}`);
}
