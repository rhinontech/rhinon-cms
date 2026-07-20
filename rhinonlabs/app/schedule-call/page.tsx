import { Metadata } from "next";
import SchedulerCore from "@/components/Common/CTA/SchedulerCore";

export const metadata: Metadata = {
  title: "Schedule a Call | Rhinon Labs",
  description: "Pick a time to see Rhinon Labs in action — a 30 minute call over Google Meet.",
};

export default function ScheduleCallPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0B0F19]">
      <SchedulerCore />
    </main>
  );
}
