import type { Metadata } from "next";
import { MeetPage } from "@/components/Admin/Chat/MeetPage";

export const metadata: Metadata = { title: "Join meeting" };

export default async function MeetRoutePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <MeetPage token={token} />;
}
