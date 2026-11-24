import { redirect } from "next/navigation";

/** This was an empty placeholder; people are added and opened from the HR & People directory. */
export default async function EmployeesPlaceholderPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/employees`);
}
