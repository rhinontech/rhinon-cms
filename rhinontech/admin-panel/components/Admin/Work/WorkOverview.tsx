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
    <div className={cn("flex h-full flex-col overflow-hidden bg-stone-50", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <SubNavToggle />
        <div>
          <h1 className="text-base font-semibold tracking-tight text-gray-900">Work overview</h1>
          <p className="text-xs text-gray-500">Tasks, active projects, clients, and incoming client work.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <section key={card.label} className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {card.icon}
                {card.label}
              </div>
              <p className="mt-4 text-3xl font-semibold text-gray-900">{card.value}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Recent client bugs and change requests</p>
                <p className="mt-1 text-xs text-gray-500">Latest items coming in from clients across projects.</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-gray-600">
                {data?.recentRequests.length ?? 0} items
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {(data?.recentRequests ?? []).map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <Badge value={item.type} tone={item.type === "Bug" ? "red" : "blue"} />
                    <Badge value={item.status} tone="stone" />
                    <Badge value={item.priority} tone={item.priority === "High" ? "amber" : "stone"} />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {item.project ? item.project.name : "Not linked to a project yet"}
                  </p>
                </div>
              ))}
              {!data?.recentRequests.length && (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                  No client issues or change requests logged yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-sm font-semibold text-gray-900">Snapshot</p>
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
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function Badge({ value, tone }: { value: string; tone: "red" | "blue" | "amber" | "stone" }) {
  const tones = {
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    stone: "bg-stone-100 text-stone-700",
  };

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{value}</span>;
}
