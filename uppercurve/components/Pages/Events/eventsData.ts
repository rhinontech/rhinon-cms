export interface UpcomingEvent {
  slug: string;
  title: string;
  tagline: string;
  type: string;
  month: string;
  day: string;
  dateLabel: string;
  time: string;
  location: string;
  mode: "Online" | "In person";
  /** Tailwind gradient classes for the poster artwork */
  gradient: string;
  /** Tailwind classes for the type chip on light backgrounds */
  chip: string;
  about: string[];
  agenda: { time: string; item: string }[];
  takeaways: string[];
}

export const upcomingEvents: UpcomingEvent[] = [
  {
    slug: "building-with-ai-tools",
    title: "Building with AI Tools",
    tagline:
      "A hands-on workshop: build a working AI-powered mini-project in two hours and take it home.",
    type: "Workshop",
    month: "Aug",
    day: "22",
    dateLabel: "Aug 22, 2026",
    time: "6:00 PM IST",
    location: "Online · Zoom",
    mode: "Online",
    gradient: "bg-gradient-to-br from-indigo-500 via-indigo-700 to-slate-950",
    chip: "bg-indigo-50 border-indigo-100 text-indigo-600",
    about: [
      "AI tooling is moving faster than any syllabus can keep up with. This workshop skips the theory dump and goes straight to building: you'll pick a small, real problem and ship a working AI-powered solution before the session ends.",
      "You'll work alongside mentors who build with these tools daily. Bring a laptop and a problem you'd love to automate — leave with something running, and the confidence to keep going.",
    ],
    agenda: [
      { time: "6:00 PM", item: "Kickoff — what we're building and why it matters" },
      { time: "6:20 PM", item: "Guided build: wiring up your first AI workflow" },
      { time: "7:10 PM", item: "Open build time with mentors on call" },
      { time: "7:45 PM", item: "Show & tell + where to take it next" },
    ],
    takeaways: [
      "A working AI mini-project you built yourself",
      "A practical mental model for choosing AI tools",
      "Starter templates you can reuse on your next idea",
    ],
  }
  // },
  // {
  //   slug: "show-your-work-vol-8",
  //   title: "Show Your Work Vol. 8",
  //   tagline:
  //     "Present one project, get live feedback from mentors and industry professionals in the room.",
  //   type: "Showcase",
  //   month: "Sep",
  //   day: "05",
  //   dateLabel: "Sep 5, 2026",
  //   time: "5:30 PM IST",
  //   location: "Bengaluru · HSR Layout",
  //   mode: "In person",
  //   gradient: "bg-gradient-to-br from-amber-400 via-orange-600 to-stone-950",
  //   chip: "bg-amber-50 border-amber-100 text-amber-600",
  //   about: [
  //     "The fastest way to level up your work is to put it in front of people who've done it before. At Show Your Work, you present one project — any stage, any stack — and get honest, specific feedback from mentors and industry professionals in the room.",
  //     "No slides required, no gatekeeping. Presenting is optional; listening is free. Either way you'll leave with sharper taste and a longer list of people to build with.",
  //   ],
  //   agenda: [
  //     { time: "5:30 PM", item: "Doors open, coffee and introductions" },
  //     { time: "6:00 PM", item: "Project presentations, five minutes each" },
  //     { time: "7:15 PM", item: "Feedback circles with mentors" },
  //     { time: "8:00 PM", item: "Open networking" },
  //   ],
  //   takeaways: [
  //     "Direct feedback on your project from professionals",
  //     "Presentation reps in a friendly room",
  //     "Connections with builders in your city",
  //   ],
  // },
  // {
  //   slug: "48-hour-build-jam",
  //   title: "48-hour Build Jam",
  //   tagline:
  //     "Teams of three build a working solution to a real nonprofit's brief. Winners get a 1:1 with our mentors.",
  //   type: "Build Jam",
  //   month: "Sep",
  //   day: "18",
  //   dateLabel: "Sep 18–20, 2026",
  //   time: "Starts 9:00 AM IST",
  //   location: "Online · Discord",
  //   mode: "Online",
  //   gradient: "bg-gradient-to-br from-fuchsia-500 via-purple-700 to-slate-950",
  //   chip: "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-600",
  //   about: [
  //     "One real brief from a working nonprofit. Teams of three. Forty-eight hours. The Build Jam is the closest thing to real product work you can get without a job title — scoping under pressure, dividing work, and shipping something that actually runs.",
  //     "Mentors float between teams all weekend, and every team demos on Sunday evening. The winning team gets dedicated 1:1 sessions with our mentors to take the project further.",
  //   ],
  //   agenda: [
  //     { time: "Fri 9:00 AM", item: "Brief drop, team formation, kickoff call" },
  //     { time: "Fri–Sun", item: "Build time with mentor office hours" },
  //     { time: "Sun 5:00 PM", item: "Code freeze and demo prep" },
  //     { time: "Sun 6:00 PM", item: "Live demos and winner announcement" },
  //   ],
  //   takeaways: [
  //     "A shipped team project for your portfolio",
  //     "Experience scoping and building under a real deadline",
  //     "Teammates you've actually built something with",
  //   ],
  // },
  // {
  //   slug: "breaking-into-tech-careers",
  //   title: "Breaking Into Tech Careers",
  //   tagline:
  //     "An open Q&A with engineers, product managers, and founders on landing your first role.",
  //   type: "AMA",
  //   month: "Oct",
  //   day: "03",
  //   dateLabel: "Oct 3, 2026",
  //   time: "7:00 PM IST",
  //   location: "Online · YouTube Live",
  //   mode: "Online",
  //   gradient: "bg-gradient-to-br from-cyan-400 via-sky-600 to-slate-950",
  //   chip: "bg-cyan-50 border-cyan-100 text-cyan-600",
  //   about: [
  //     "How do people actually get their first role in tech — not the LinkedIn-highlight version, the real one? This AMA puts engineers, product managers, and founders in front of your questions for ninety unscripted minutes.",
  //     "Ask anything: portfolios vs. degrees, how hiring actually works from the inside, what to do when you have no experience, and what they'd do differently starting today.",
  //   ],
  //   agenda: [
  //     { time: "7:00 PM", item: "Panel introductions and opening question" },
  //     { time: "7:15 PM", item: "Open Q&A from live chat" },
  //     { time: "8:15 PM", item: "Rapid-fire advice round" },
  //     { time: "8:30 PM", item: "Wrap-up and resources" },
  //   ],
  //   takeaways: [
  //     "Straight answers about breaking into tech",
  //     "A realistic picture of how hiring works",
  //     "A recording and resource list after the event",
  //   ],
  // },
  // {
  //   slug: "ship-your-first-side-project",
  //   title: "Ship Your First Side Project",
  //   tagline:
  //     "From idea to deployed in one day — scoping, tooling, and the momentum to actually finish.",
  //   type: "Workshop",
  //   month: "Oct",
  //   day: "24",
  //   dateLabel: "Oct 24, 2026",
  //   time: "11:00 AM IST",
  //   location: "Mumbai · Andheri East",
  //   mode: "In person",
  //   gradient: "bg-gradient-to-br from-emerald-400 via-teal-600 to-slate-950",
  //   chip: "bg-emerald-50 border-emerald-100 text-emerald-600",
  //   about: [
  //     "Everyone has a half-finished side project. This full-day workshop is about breaking that pattern: scope something honest, build the core, deploy it, and tell people about it — all before dinner.",
  //     "We provide the structure, the tooling shortcuts, and mentors who unblock you fast. You provide the idea. Small is beautiful; shipped beats perfect.",
  //   ],
  //   agenda: [
  //     { time: "11:00 AM", item: "Scoping clinic: cut your idea down to one day" },
  //     { time: "12:00 PM", item: "Build sprint one, with mentors on the floor" },
  //     { time: "3:00 PM", item: "Build sprint two: deploy and polish" },
  //     { time: "6:00 PM", item: "Launch circle — everyone ships, everyone shares" },
  //   ],
  //   takeaways: [
  //     "A deployed side project with a public link",
  //     "A repeatable one-day shipping playbook",
  //     "The momentum of having actually finished something",
  //   ],
  // },
  // {
  //   slug: "uppercurve-community-meetup",
  //   title: "UpperCurve Community Meetup",
  //   tagline:
  //     "No agenda, just ambitious people. Coffee, demos, and a lightning-talk open mic for anyone who signs up.",
  //   type: "Meetup",
  //   month: "Nov",
  //   day: "14",
  //   dateLabel: "Nov 14, 2026",
  //   time: "4:00 PM IST",
  //   location: "Delhi · Connaught Place",
  //   mode: "In person",
  //   gradient: "bg-gradient-to-br from-rose-400 via-rose-600 to-stone-950",
  //   chip: "bg-rose-50 border-rose-100 text-rose-600",
  //   about: [
  //     "Some of the best career moves start as hallway conversations. The community meetup is deliberately unstructured: coffee, demos of whatever people are building, and an open mic for five-minute lightning talks.",
  //     "Students, builders, mentors, and the simply curious are all welcome. Come alone — you won't leave that way.",
  //   ],
  //   agenda: [
  //     { time: "4:00 PM", item: "Doors open, coffee and conversations" },
  //     { time: "4:45 PM", item: "Lightning talks — open mic, five minutes each" },
  //     { time: "5:45 PM", item: "Demo corner and open networking" },
  //     { time: "7:00 PM", item: "Wind down" },
  //   ],
  //   takeaways: [
  //     "New people in your corner",
  //     "A look at what the community is building",
  //     "A low-stakes stage if you want speaking reps",
  //   ],
  // },
];

export function getEventBySlug(slug: string): UpcomingEvent | undefined {
  return upcomingEvents.find((event) => event.slug === slug);
}
