import { redirect } from "next/navigation";

/** Attendance has one home, under Attendance & Leave; this old duplicate path lands there. */
export default async function WorkAttendanceMovedPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/attendance`);
}
