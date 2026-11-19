import { pageMeta } from "@/components/site";
import { Aurora } from "@/components/ui";
import { Scheduler } from "@/components/forms/Scheduler";

export const metadata = pageMeta({
  title: "Book a demo",
  description: "Pick a time for a 30 minute walk through Rhinon Tech over Google Meet, built around your team.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <section className="relative px-5 pb-24 pt-12 sm:pt-16">
      <Aurora />
      <div className="relative"><Scheduler /></div>
    </section>
  );
}
