"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbCircleCheck, TbClockPause, TbSparkles } from "react-icons/tb";
import { EmptyState } from "../shared/EmptyState";
import { isLinkedInChannel } from "../shared/ChannelIcon";
import type { Campaign } from "../shared/types";

export function NeedsAttention({ campaigns, loading }: { campaigns: Campaign[]; loading: boolean }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const paused = campaigns.filter((c) => c.stage === "Paused" && !isLinkedInChannel(c.channel));
  const unpublished = campaigns.filter((c) => isLinkedInChannel(c.channel) && !c.platformPostId && c.aiDraft);

  const items = [
    ...paused.map((c) => ({
      key: `paused-${c.id}`,
      href: `/${roleSlug}/outreach/campaigns/${c.id}`,
      icon: <TbClockPause size={15} className="text-muted-foreground" />,
      title: c.name,
      hint: "Paused — resume when ready",
    })),
    ...unpublished.map((c) => ({
      key: `unpub-${c.id}`,
      href: `/${roleSlug}/outreach/publishing/${c.id}`,
      icon: <TbSparkles size={15} className="text-blue-500 dark:text-blue-400" />,
      title: c.name,
      hint: "Draft ready — publish to LinkedIn",
    })),
  ];

  if (loading) return null;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<TbCircleCheck size={36} />}
        title="All caught up"
        description="No campaigns need attention right now."
        className="py-10"
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {items.slice(0, 6).map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/40"
        >
          {item.icon}
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{item.title}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">{item.hint}</span>
        </Link>
      ))}
    </div>
  );
}
