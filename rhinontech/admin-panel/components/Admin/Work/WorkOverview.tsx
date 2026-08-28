"use client";

import { useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { TbAlertCircle, TbBriefcase, TbChecklist } from "react-icons/tb";

interface WorkRequest {
  id: string;
  title: string;
  type: "Bug" | "Change request";
  status: "Open" | "In review" | "In progress" | "Done";
  priority: "Low" | "Medium" | "High";
  project: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface WorkOverviewResponse {
  totalTasks: number;
  totalProjects: number;
  activeProjects: number;
  openRequests: number;
  recentRequests: WorkRequest[];
}

export function WorkOverview() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [data, setData] = useState<WorkOverviewResponse | null>(null);

  useEffect(() => {
    apiFetch<WorkOverviewResponse>("/work/overview").then(setData).catch(() => {});
  }, []);

  const cards = [
    { label: "Total tasks", value: data?.totalTasks ?? "—", icon: <TbChecklist size={18} /> },
    { label: "Projects / clients", value: data?.totalProjects ?? "—", icon: <TbBriefcase size={18} /> },
    { label: "Open client items", value: data?.openRequests ?? "—", icon: <TbAlertCircle size={18} /> },
    { label: "Active projects", value: data?.activeProjects ?? "—", icon: <TbBriefcase size={18} /> },
  ];

  return (
    <div className={cn("flex h-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <SubNavToggle />
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Work overview</h1>
          <p className="text-xs text-muted-foreground">Tasks, active projects, clients, and incoming client work.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <section key={card.label} className="rounded-xl glass-card p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {card.icon}
                {card.label}
              </div>
              <p className="mt-4 text-3xl font-semibold text-foreground">{card.value}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Recent client bugs and change requests</p>
                <p className="mt-1 text-xs text-muted-foreground">Latest items coming in from clients across projects.</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/70">
                {data?.recentRequests.length ?? 0} items
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {(data?.recentRequests ?? []).map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <Badge value={item.type} tone={item.type === "Bug" ? "red" : "blue"} />
                    <Badge value={item.status} tone="stone" />
                    <Badge value={item.priority} tone={item.priority === "High" ? "amber" : "stone"} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.project ? item.project.name : "Not linked to a project yet"}
                  </p>
                </div>
              ))}
              {!data?.recentRequests.length && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No client issues or change requests logged yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl glass-card p-5">
            <p className="text-sm font-semibold text-foreground">Snapshot</p>
            <div className="mt-5 space-y-4">
              <StatRow label="Active projects" value={String(data?.activeProjects ?? 0)} />
              <StatRow label="Total projects / clients" value={String(data?.totalProjects ?? 0)} />
              <StatRow label="Tasks in system" value={String(data?.totalTasks ?? 0)} />
              <StatRow label="Open change items" value={String(data?.openRequests ?? 0)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Badge({ value, tone }: { value: string; tone: "red" | "blue" | "amber" | "stone" }) {
  const tones = {
    red: "bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-300",
    blue: "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
    amber: "bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300",
    stone: "bg-muted text-foreground/85",
  };

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{value}</span>;
}
